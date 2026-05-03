import Badge from "./Badge";
import styles from "./BlogCard.module.css";

const ExternalIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

export default function BlogCard({ activity }) {
  const { title, description, tags, date, emoji, accentColor, link } = activity;

  return (
    <article className={styles.card}>
      <div className={styles.accent} style={{ background: accentColor }} />
      <div className={styles.body}>
        <div className={styles.top}>
          <span className={styles.emoji}>{emoji}</span>
          <time className={styles.date}>{date}</time>
        </div>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.description}>{description}</p>
        <div className={styles.tags}>
          {tags.map((tag) => (
            <Badge key={tag}>{tag}</Badge>
          ))}
        </div>
        {link && (
          <div className={styles.footer}>
            <a href={/^https?:\/\//.test(link) ? link : `https://${link}`} target="_blank" rel="noopener noreferrer" className={styles.link}>
              <ExternalIcon /> Visit
            </a>
          </div>
        )}
      </div>
    </article>
  );
}
