export class Cell {
	id: string;
	x: number;
	y: number;
	constructor(x: number, y: number) {
		this.x = x;
		this.y = y;
		this.id = x + `:` + y;
	}
}

type Update = {
	cell: Cell;
	isAlive: boolean;
	score: number;
};

export class LifeSimulator {
	cells: Map<string, Cell>;
	testCells: Map<string, Cell>;

	constructor() {
		this.cells = new Map<string, Cell>();
		this.testCells = new Map<string, Cell>();
	}

	addToCheckList(x: number, y: number) {
		const id = x + `:` + y;
		if (!this.testCells.has(id)) {
			this.testCells.set(id, new Cell(x, y));
		}
	}

	scoreCell(x: number, y: number, shouldCheckNeighbors: boolean): number {
		let score = 0;
		for (let i = x - 1; i <= x + 1; i++) {
			for (let j = y - 1; j <= y + 1; j++) {
				const id = i + `:` + j;
				if (this.cells.has(id)) {
					score += 1;
				} else if (shouldCheckNeighbors) {
					this.addToCheckList(i, j);
				}
			}
		}
		return score;
	}

	update() {
		this.testCells.clear();
		const updates: Array<Update> = new Array<Update>();

		// check all currently live cells and append dead neighbors to check list
		for (const cell of this.cells.values()) {
			const score = this.scoreCell(cell.x, cell.y, true);
			updates.push({ cell: cell, isAlive: true, score: score });
		}
		// check all dead neighbors of live cells
		for (const cell of this.testCells.values()) {
			const score = this.scoreCell(cell.x, cell.y, false);
			updates.push({ cell: cell, isAlive: false, score: score });
		}

		// apply updates
		for (const update of updates) {
			if (update.score === 4) {
				// retain current status
				continue;
			} else if (update.score === 3) {
				// life
				if (!update.isAlive) {
					this.cells.set(update.cell.id, update.cell);
				}
			} else {
				// death
				if (update.isAlive) {
					this.cells.delete(update.cell.id);
				}
			}
		}
	}
}
