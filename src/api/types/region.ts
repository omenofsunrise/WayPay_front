export interface Region {
    id: number,
    name: string,
}

export interface District {
    id: number,
    name: string,
    regionId: number;
}