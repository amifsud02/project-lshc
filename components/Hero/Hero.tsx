import { Header } from '../Headers/Header';
import { MobileNav } from '../Headers/MobileNavigation';
import styles from './Hero.module.css';

const HeroSection = () => {
  return (
    <section className={styles.hero}>
      <div>
        <Header />

        <div className={`parent`}>
          <div className={`${styles.animate__animated} ${styles.animate__backInLeft} ${styles.hpTitle}`}>
            <h1>La Salle<br />Handball<br />Club</h1>
          </div>
        </div>
      </div>

    </section>
  );
};

export default HeroSection;