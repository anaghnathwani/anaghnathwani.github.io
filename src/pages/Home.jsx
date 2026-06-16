import { Link } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import Section from "../components/Section";
import ProjectCard from "../components/ProjectCard";
import Button from "../components/Button";
import { profile } from "../data/profile";
import { projects } from "../data/projects";
import styles from "./Home.module.css";

const ArrowRight = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

export default function Home() {
  const featured = projects.filter((p) => p.featured);

  return (
    <PageLayout>
      {/* ── Hero ── */}
      <div className={styles.hero}>
        <div className={styles.heroDots} aria-hidden />
        <div className={styles.heroGlow} aria-hidden />
        <div className={styles.heroInner}>
          <p className={styles.greeting}>Hey, I'm</p>
          <h1 className={styles.name}>{profile.name}</h1>
          <p className={styles.subtitle}>{profile.tagline}</p>
          <div className={styles.ctas}>
            <Button href="/projects" size="lg">
              View my work <ArrowRight />
            </Button>
            <Button href={`mailto:${profile.email}`} variant="secondary" size="lg">
              Get in touch
            </Button>
          </div>
        </div>
      </div>

      {/* ── Featured Projects ── */}
      <Section title="Featured Projects" id="projects">
        <div className={styles.grid}>
          {featured.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
        <div className={styles.allLink}>
          <Link to="/projects" className={styles.viewAll}>
            View all projects <ArrowRight />
          </Link>
        </div>
      </Section>

      {/* ── About Snippet ── */}
      <Section title="About Me" id="about">
        <div className={styles.aboutSnippet}>
          <div className={styles.aboutText}>
            <p className={styles.bio}>{profile.bio}</p>
            <div className={styles.aboutCtas}>
              <Button href="/about" variant="secondary">
                More about me <ArrowRight />
              </Button>
              <Button href={profile.github} variant="ghost" external>
                GitHub
              </Button>
            </div>
          </div>
          <div className={styles.quickSkills}>
            {profile.skills.map((group) => (
              <div key={group.category} className={styles.skillGroup}>
                <span className={styles.skillCategory}>{group.category}</span>
                <span className={styles.skillItems}>{group.items.join(", ")}</span>
              </div>
            ))}
          </div>
        </div>
      </Section>
    </PageLayout>
  );
}
