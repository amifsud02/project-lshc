import Image from "next/image"
import styles from './PlayerCard.module.css'
import { IPlayerCard } from "../../pages/teams/men-first-team";



const PlayerCard: React.FC<{playerInfo: IPlayerCard}> = ({playerInfo}) => {
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

                </div>
                <div className={styles.playerOverlay}></div>
            </a>
        </li >
    )
}

export default PlayerCard;