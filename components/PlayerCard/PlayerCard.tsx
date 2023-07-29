import Image from "next/image"
import styles from './PlayerCard.module.css'
import { IPlayerCard } from "@/lib/types/player.type";

const PlayerCard: React.FC<{playerInfo: IPlayerCard, profilePicture: string}> = ({playerInfo, profilePicture}) => {
    return (
        <li className={styles.playerContainer}>
            <a className={styles.playerContainerLink}>
                <div className={styles.playerText}>
                    <p className={styles.playerNumber}>{playerInfo.number}</p>
                    <hr className={styles.playerDivider}/>
                    <h3 className={`${styles.playerNoMargin} ${styles.playerFirstName}`}>{playerInfo.firstName}</h3>
                    <h3 className={`${styles.playerNoMargin} ${styles.playerLastName}`}>{playerInfo.lastName}</h3>
                </div>
                <div className={styles.playerPhoto}>
                    <Image src={profilePicture} alt="placeholder-image" fill={true}/>
                    <div className={styles.playerOverlay}></div>
                </div>
            </a>
        </li >
    )
}

export default PlayerCard;