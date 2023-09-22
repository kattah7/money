export class RoundRobin {
    private values: string[] = [];
    private currentIndex: number = 0;

    get size(): number {
        return this.values.length;
    }

    get(): string {
        if (this.currentIndex >= this.size) {
            this.currentIndex = 1;
            return this.values[0];
        }
        return this.values[this.currentIndex++];
    }

    has(value: string): boolean {
        return this.values.indexOf(value) >= 0;
    }

    add(value: string): void {
        if(!this.has(value)) {
            this.values.push(value);
        }
    }

    indexOf(value: string): number {
        return this.values.indexOf(value);
    }

    findIndex(predicate: (value: string, index: number, values: string[]) => unknown): number {
        return this.values.findIndex(predicate);
    }

    remove(value: string): boolean {
        if(!this.has(value)) {
            return false;
        }
        return this.removeByIndex(this.indexOf(value));
    }

    removeByIndex(index: number): boolean {
        if (index < 0 || index > this.size) {
            return false;
        }
        this.values.splice(index, 1);
        return true;
    }
}