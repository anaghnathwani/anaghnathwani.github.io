import { profile } from "../data/profile";
import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <p className={styles.copy}>
        © {new Date().getFullYear()} {profile.name}
      </p>
      <div className={styles.links}>
        <a href={profile.github} target="_blank" rel="noopener noreferrer" className={styles.link}>
          GitHub
        </a>
        <a href={`mailto:${profile.email}`} className={styles.link}>
          Email
        </a>
      </div>
    </footer>
  );
}
