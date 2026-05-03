import { useState } from "react";
import PageLayout from "../components/PageLayout";
import BlogCard from "../components/BlogCard";
import { activities } from "../data/blog";
import styles from "./Blog.module.css";

const allTags = ["All", ...new Set(activities.flatMap((a) => a.tags))];

export default function Blog() {
  const [activeTag, setActiveTag] = useState("All");

  const filtered =
    activeTag === "All"
      ? activities
      : activities.filter((a) => a.tags.includes(activeTag));

  return (
    <PageLayout>
      <div className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.title}>Blog</h1>
          <p className={styles.subtitle}>
            Things I do, try, and think about outside of code.
          </p>
        </div>

        <div className={styles.filters}>
          {allTags.map((tag) => (
            <button
              key={tag}
              className={[
                styles.filterBtn,
                activeTag === tag ? styles.filterActive : "",
              ].join(" ")}
              onClick={() => setActiveTag(tag)}
            >
              {tag}
            </button>
          ))}
        </div>

        <div className={styles.grid}>
          {filtered.map((activity) => (
            <BlogCard key={activity.id} activity={activity} />
          ))}
        </div>

        {filtered.length === 0 && (
          <p className={styles.empty}>Nothing here yet for that tag.</p>
        )}
      </div>
    </PageLayout>
  );
}
