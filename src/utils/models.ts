export enum ModeEnum {
    DEC,
    BIN,
}

export type Coord = {
    ligne: number;
    col: number;
};

export const compareCoord = (coord1: Coord, coord2: Coord) =>
    coord1.ligne === coord2.ligne && coord1.col === coord2.col;

export class Karnaugh {
    nbVar: number;
    table: number[][];
    voisinageAlreadyCompute: Coord[][];

    constructor(nbVar: number) {
        if (nbVar < 2 || nbVar > 6) {
            throw new Error("nbVar");
        }
        this.nbVar = nbVar;
        this.table = [];
        this.initTable();
        this.voisinageAlreadyCompute = [];
    }

    width() {
        return 0b1 << (Math.floor(this.nbVar / 2) + (this.nbVar % 2));
    }

    height() {
        return 0b1 << Math.floor(this.nbVar / 2);
    }

    initTable() {
        this.table = [];
        for (let i = 0; i < this.height(); i++) {
            const row = [];
            for (let j = 0; j < this.width(); j++) {
                row.push(-1);
            }
            this.table.push(row);
        }
    }

    static getGrayCode(nbVar: number): number[] {
        const getGrayCodeRec = (
            nbVar: number,
            res: number[] = [],
            nbTour: number = 0
        ): number[] => {
            if (nbTour === nbVar) {
                return res;
            }
            if (res.length === 0) {
                return getGrayCodeRec(nbVar, [0b0, 0b1], nbTour + 1);
            }
            const newRes = [
                ...res,
                ...res.reverse().map((val) => val | (0b1 << nbTour)),
            ];
            return getGrayCodeRec(nbVar, newRes, nbTour + 1);
        };
        return getGrayCodeRec(nbVar);
    }

    updateCell(
        posVertical: number,
        posHorizontal: number,
        value: number
    ): boolean {
        if (value < -1 || value >= 0b1 << this.nbVar) {
            return false;
        }
        const newTable = [];

        for (let i = 0; i < this.height(); i++) {
            const row = [];
            for (let j = 0; j < this.width(); j++) {
                if (i === posVertical && j === posHorizontal) {
                    row.push(value);
                } else {
                    row.push(this.table[i][j]);
                }
            }
            newTable.push(row);
        }

        this.table = [...newTable];
        return true;
    }

    addClause(value: number): boolean {
        if (value < 0 || value >= 0b1 << this.nbVar) {
            return false;
        }
        const isBits: number[] = [];
        for (let i = 0; i < this.nbVar; i++) {
            isBits.push(value & (0b1 << (this.nbVar - i - 1)));
        }

        const bitsVertical = isBits.slice(0, Math.log2(this.height()));
        const bitsHorizontal = isBits.slice(Math.log2(this.height()));

        console.log(bitsVertical, bitsHorizontal);

        const valVertical = bitsVertical.reduce(
            (p, n) => p + (n >> Math.log2(this.width())),
            0
        );

        const valHorizontal = bitsHorizontal.reduce((p, n) => p + n);
        const posVertical = Karnaugh.getGrayCode(
            Math.log2(this.height())
        ).indexOf(valVertical);
        const posHorizontal = Karnaugh.getGrayCode(
            Math.log2(this.width())
        ).indexOf(valHorizontal);
        this.updateCell(posVertical, posHorizontal, value);
        return true;
    }

    getStringClause(): string[] {
        const res: string[] = [];
        for (let i = 0; i < this.height(); i++) {
            for (let j = 0; j < this.width(); j++) {
                if (this.table[i][j] !== -1) {
                    let s = "";
                    for (let k = 0; k < this.nbVar; k++) {
                        if (
                            (this.table[i][j] &
                                (0b1 << (this.nbVar - k - 1))) !==
                            0
                        ) {
                            s += String.fromCharCode("a".charCodeAt(0) + k);
                        } else {
                            s +=
                                "-" +
                                String.fromCharCode("a".charCodeAt(0) + k);
                        }
                        s += " ";
                    }
                    res.push(s.slice(0, -1));
                }
            }
        }
        return res;
    }

    getCell(coord: Coord): number {
        return this.table[coord.ligne][coord.col];
    }

    getDecalageHaut(coord: Coord, n: number = 1): Coord {
        let ligne = coord.ligne - (n % this.height());
        if (ligne < 0) {
            ligne += this.height();
        }
        return { ligne, col: coord.col };
    }

    getDecalageBas(coord: Coord, n: number = 1): Coord {
        let ligne = (coord.ligne + n) % this.height();
        return { ligne, col: coord.col };
    }

    getDecalageGauche(coord: Coord, n: number = 1): Coord {
        let col = coord.col - (n % this.width());
        if (col < 0) {
            col += this.width();
        }
        return { ligne: coord.ligne, col };
    }

    getDecalageDroite(coord: Coord, n: number = 1): Coord {
        let col = (coord.col + n) % this.width();
        return { ligne: coord.ligne, col };
    }

    getVoisinage(): Coord[][] {
        const coordNonVides: Coord[] = [];
        for (let i = 0; i < this.height(); i++) {
            for (let j = 0; j < this.width(); j++) {
                if (this.table[i][j] !== -1) {
                    coordNonVides.push({ ligne: i, col: j });
                }
            }
        }

        let voisinages: Coord[][] = [];
        this.voisinageAlreadyCompute = [];

        for (const coordNonVide of coordNonVides) {
            const newVoisinages = this.getVoisinageCoords([coordNonVide]);
            const newVoisinagesFilter = newVoisinages.filter((voisin1) =>
                this.voisinageAlreadyCompute.every(
                    (voisin2) =>
                        voisin1.length !== voisin2.length ||
                        voisin2.some((coord1) =>
                            voisin1.every(
                                (coord2) => !compareCoord(coord1, coord2)
                            )
                        )
                )
            );
            this.voisinageAlreadyCompute = [
                ...this.voisinageAlreadyCompute,
                ...newVoisinagesFilter,
            ];
            voisinages = [...voisinages, ...newVoisinagesFilter];
        }

        let res: Coord[][] = [];
        for (const voisin1 of voisinages) {
            if (
                res.every(
                    (voisin2) =>
                        voisin1.length !== voisin2.length ||
                        voisin2.some((coord1) =>
                            voisin1.every(
                                (coord2) => !compareCoord(coord1, coord2)
                            )
                        )
                )
            ) {
                res.push(voisin1);
            }
        }

        console.log(res);

        return res;
    }

    getVoisinageCoords(coords: Coord[]): Coord[][] {
        let nbreDecalageHauteur = 1;
        coords.forEach((coord) => {
            let decalageHaut = this.getDecalageHaut(coord, nbreDecalageHauteur);
            while (coords.some((it) => compareCoord(it, decalageHaut))) {
                nbreDecalageHauteur++;
                if (nbreDecalageHauteur === this.height()) {
                    nbreDecalageHauteur = 0;
                    break;
                }
                decalageHaut = this.getDecalageHaut(coord, nbreDecalageHauteur);
            }
        });

        let nbreDecalageLargeur = 1;
        coords.forEach((coord) => {
            let decalageDroite = this.getDecalageDroite(
                coord,
                nbreDecalageLargeur
            );
            while (coords.some((it) => compareCoord(it, decalageDroite))) {
                nbreDecalageLargeur++;
                if (nbreDecalageLargeur === this.height()) {
                    nbreDecalageLargeur = 0;
                    break;
                }
                decalageDroite = this.getDecalageDroite(
                    coord,
                    nbreDecalageLargeur
                );
            }
        });

        let resHaut: Coord[][] = [];
        let resBas: Coord[][] = [];
        if (nbreDecalageHauteur > 0) {
            const decalageHaut = coords.map((coord) =>
                this.getDecalageHaut(coord, nbreDecalageHauteur)
            );

            if (decalageHaut.every((coord) => this.getCell(coord) !== -1)) {
                resHaut = this.getVoisinageCoords([...coords, ...decalageHaut]);
            }

            const decalageBas = coords.map((coord) =>
                this.getDecalageBas(coord, nbreDecalageHauteur)
            );

            if (decalageBas.every((coord) => this.getCell(coord) !== -1)) {
                resBas = this.getVoisinageCoords([...coords, ...decalageBas]);
            }
        }

        let resGauche: Coord[][] = [];
        let resDroite: Coord[][] = [];

        if (nbreDecalageLargeur > 0) {
            const decalageGauche = coords.map((coord) =>
                this.getDecalageGauche(coord, nbreDecalageLargeur)
            );

            if (decalageGauche.every((coord) => this.getCell(coord) !== -1)) {
                resGauche = this.getVoisinageCoords([
                    ...coords,
                    ...decalageGauche,
                ]);
            }

            const decalageDroite = coords.map((coord) =>
                this.getDecalageDroite(coord, nbreDecalageLargeur)
            );

            if (decalageDroite.every((coord) => this.getCell(coord) !== -1)) {
                resDroite = this.getVoisinageCoords([
                    ...coords,
                    ...decalageDroite,
                ]);
            }
        }

        let res: Coord[][] = [];

        if (
            resHaut.length === 0 &&
            resBas.length === 0 &&
            resGauche.length === 0 &&
            resDroite.length === 0
        ) {
            res = [coords];
        } else {
            res = [...resHaut, ...resBas, ...resGauche, ...resDroite];
        }

        return res;
    }
}

export const karnaugh = new Karnaugh(2);
