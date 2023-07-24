export type IPlayerCard = {
    number: number;
    firstName: string;
    lastName: string;
    profilePicture?: string;
    position?: 'Goalkeeper' | 'LinePlayer' | 'Winger' | 'PlayMaker' | 'Lateral' | 'Coach';
}