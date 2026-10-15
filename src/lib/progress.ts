import { shuffleWith } from "./shuffle";
import type {
  Direction,
  SingleDirection,
  StoredDirectionProgress,
  StoredProgress,
} from "./types";

const DIRECTIONS: SingleDirection[] = ["de2en", "en2de"];

const PLAN_MIN_DISTANCE = 2;
const PLAN_MAX_DISTANCE = 10;

export interface PlanQuestion {
  id: string;
  direction: SingleDirection;
  refresh: boolean;
}

export interface WordStatus {
  de2en: boolean;
  en2de: boolean;
  learned: boolean;
}

export interface PlanOptions {
  direction: Direction;
  count?: number;
  random?: () => number;
  refreshProbability?: number;
  offsetRange?: number;
}

export interface ReaskOptions {
  gap?: number;
  random?: () => number;
  direction?: SingleDirection;
}

export interface ReaskPlan {
  position: number;
  direction: SingleDirection;
}

function opposite(direction: SingleDirection): SingleDirection {
  return direction === "de2en" ? "en2de" : "de2en";
}

function clampFrontier(value: unknown, size: number): number {
  const parsed = typeof value === "number" && Number.isFinite(value) ? Math.floor(value) : 0;
  if (parsed < 0) return 0;
  if (parsed > size) return size;
  return parsed;
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export class WordProgress {
  private readonly ids: string[];
  private readonly order: Map<string, number>;
  private readonly known: Record<SingleDirection, Set<string>>;

  constructor(ids: readonly string[], stored?: StoredProgress | null) {
    this.ids = [...ids];
    this.order = new Map(this.ids.map((id, index) => [id, index]));
    this.known = { de2en: new Set(), en2de: new Set() };

    for (const direction of DIRECTIONS) {
      const data = stored?.[direction];
      const set = this.known[direction];
      if (!data || typeof data !== "object") continue;

      const knownAbove = new Set(toStringArray(data.knownAbove));
      const unknownBelow = new Set(toStringArray(data.unknownBelow));
      const frontier = clampFrontier(data.frontier, this.ids.length);

      for (let index = 0; index < this.ids.length; index += 1) {
        const id = this.ids[index];
        if (index < frontier) {
          if (!unknownBelow.has(id)) set.add(id);
        } else if (knownAbove.has(id)) {
          set.add(id);
        }
      }
    }
  }

  get size(): number {
    return this.ids.length;
  }

  idsInOrder(): string[] {
    return [...this.ids];
  }

  has(id: string): boolean {
    return this.order.has(id);
  }

  isKnown(direction: SingleDirection, id: string): boolean {
    return this.known[direction].has(id);
  }

  knownCount(direction: SingleDirection): number {
    return this.known[direction].size;
  }

  learnedCount(): number {
    return this.knownCount("de2en") + this.knownCount("en2de");
  }

  percent(): number {
    const total = this.ids.length * 2;
    if (total === 0) return 0;
    return Math.round((this.learnedCount() / total) * 100);
  }

  directionPercent(direction: SingleDirection): number {
    if (this.ids.length === 0) return 0;
    return Math.round((this.knownCount(direction) / this.ids.length) * 100);
  }

  isLearned(id: string): boolean {
    return this.isKnown("de2en", id) && this.isKnown("en2de", id);
  }

  status(id: string): WordStatus {
    const de2en = this.isKnown("de2en", id);
    const en2de = this.isKnown("en2de", id);
    return { de2en, en2de, learned: de2en && en2de };
  }

  firstUnknownId(): string | null {
    for (const id of this.ids) {
      if (!this.isLearned(id)) return id;
    }
    return null;
  }

  unknownIds(direction: SingleDirection): string[] {
    return this.ids.filter((id) => !this.isKnown(direction, id));
  }

  knownIds(direction: SingleDirection): string[] {
    return this.ids.filter((id) => this.isKnown(direction, id));
  }

  record(direction: SingleDirection, id: string, correct: boolean): void {
    if (!this.order.has(id)) return;
    if (correct) this.known[direction].add(id);
    else this.known[direction].delete(id);
  }

  markKnown(direction: SingleDirection, id: string): void {
    this.record(direction, id, true);
  }

  markUnknown(direction: SingleDirection, id: string): void {
    this.record(direction, id, false);
  }

  planTest(options: PlanOptions): PlanQuestion[] {
    const { direction } = options;
    const random = options.random ?? Math.random;
    const refreshProbability = options.refreshProbability ?? 0.1;
    const requested = options.count ?? 0;
    const target = requested > 0 ? Math.min(requested, this.ids.length) : this.ids.length;

    const unknown: PlanQuestion[] = [];
    const known: PlanQuestion[] = [];

    for (const id of this.ids) {
      if (direction === "mixed") {
        const de2en = this.isKnown("de2en", id);
        const en2de = this.isKnown("en2de", id);
        if (!de2en && !en2de) {
          unknown.push({ id, direction: random() < 0.5 ? "de2en" : "en2de", refresh: false });
        } else if (!de2en) {
          unknown.push({ id, direction: "de2en", refresh: false });
        } else if (!en2de) {
          unknown.push({ id, direction: "en2de", refresh: false });
        } else {
          known.push({ id, direction: random() < 0.5 ? "de2en" : "en2de", refresh: true });
        }
      } else if (this.isKnown(direction, id)) {
        known.push({ id, direction, refresh: true });
      } else {
        unknown.push({ id, direction, refresh: false });
      }
    }

    const knownPool = shuffleWith(known, random);
    const result: PlanQuestion[] = [];
    let unknownIndex = 0;
    let knownIndex = 0;

    while (result.length < target && (unknownIndex < unknown.length || knownIndex < knownPool.length)) {
      const canRefresh = unknownIndex < unknown.length && knownIndex < knownPool.length;
      if (canRefresh && random() < refreshProbability) {
        result.push(knownPool[knownIndex]);
        knownIndex += 1;
      } else if (unknownIndex < unknown.length) {
        result.push(unknown[unknownIndex]);
        unknownIndex += 1;
      } else {
        result.push(knownPool[knownIndex]);
        knownIndex += 1;
      }
    }

    const offsetRange = options.offsetRange ?? PLAN_MAX_DISTANCE;
    if (offsetRange <= 0) return result;
    return this.spaceByDistance(result, random);
  }

  private spaceByDistance(questions: PlanQuestion[], random: () => number): PlanQuestion[] {
    if (questions.length <= 1) return [...questions];

    const remaining = [...questions];
    const ordered: PlanQuestion[] = [];
    const firstIndex = Math.floor(random() * remaining.length);
    let current = remaining.splice(firstIndex, 1)[0];
    ordered.push(current);

    while (remaining.length > 0) {
      const currentIndex = this.order.get(current.id) ?? 0;
      const distanceOf = (question: PlanQuestion) =>
        Math.abs((this.order.get(question.id) ?? 0) - currentIndex);

      let candidates = remaining.filter((question) => {
        const distance = distanceOf(question);
        return distance >= PLAN_MIN_DISTANCE && distance <= PLAN_MAX_DISTANCE;
      });
      if (candidates.length === 0) {
        candidates = remaining.filter((question) => distanceOf(question) >= PLAN_MIN_DISTANCE);
      }
      if (candidates.length === 0) candidates = remaining;

      const pick = candidates[Math.floor(random() * candidates.length)];
      remaining.splice(remaining.indexOf(pick), 1);
      ordered.push(pick);
      current = pick;
    }

    return ordered;
  }

  planReask(queueLength: number, currentDirection: SingleDirection, options: ReaskOptions = {}): ReaskPlan {
    const random = options.random ?? Math.random;
    const gap = Math.max(0, options.gap ?? 5);
    const direction = options.direction ?? opposite(currentDirection);
    const length = Math.max(0, Math.floor(queueLength));
    const minPosition = Math.min(length, gap);
    const position = minPosition + Math.floor(random() * (length - minPosition + 1));
    return { position: Math.min(position, length), direction };
  }

  toJSON(): StoredProgress {
    return {
      en2de: this.serialize("en2de"),
      de2en: this.serialize("de2en"),
    };
  }

  private serialize(direction: SingleDirection): StoredDirectionProgress {
    const set = this.known[direction];
    const size = this.ids.length;

    let bestFrontier = 0;
    let bestCost = set.size;
    let knownAtOrAfter = set.size;
    let unknownBefore = 0;

    for (let cut = 0; cut <= size; cut += 1) {
      if (cut > 0) {
        const previous = this.ids[cut - 1];
        if (set.has(previous)) knownAtOrAfter -= 1;
        else unknownBefore += 1;
      }
      const cost = knownAtOrAfter + unknownBefore;
      if (cost <= bestCost) {
        bestCost = cost;
        bestFrontier = cut;
      }
    }

    const frontier = bestFrontier;
    const knownAbove: string[] = [];
    const unknownBelow: string[] = [];

    for (let index = 0; index < size; index += 1) {
      const id = this.ids[index];
      if (index < frontier) {
        if (!set.has(id)) unknownBelow.push(id);
      } else if (set.has(id)) {
        knownAbove.push(id);
      }
    }

    return { frontier, knownAbove, unknownBelow };
  }
}
