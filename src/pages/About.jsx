import PageLayout from "../components/PageLayout";
import Section from "../components/Section";
import Badge from "../components/Badge";
import Button from "../components/Button";
import { profile } from "../data/profile";
import styles from "./About.module.css";

export default function About() {
  return (
    <PageLayout>
      {/* ── Intro ── */}
      <div className={styles.intro}>
        <div className={styles.introText}>
          <h1 className={styles.title}>About me</h1>
          <p className={styles.bio}>{profile.bio}</p>
          <p className={styles.location}>📍 {profile.location}</p>
          <div className={styles.ctas}>
            <Button href={`mailto:${profile.email}`} size="md">
              Say hello
            </Button>
            <Button href={profile.github} variant="secondary" external size="md">
              GitHub
            </Button>
            
          </div>
        </div>
        <div className={styles.avatar} aria-hidden>
          <div className={styles.avatarInner}>
            <span className={styles.avatarInitials}>
              {profile.name.split(" ").map((n) => n[0]).join("")}
            </span>
          </div>
        </div>
      </div>

      {/* ── Skills ── */}
      <Section title="Skills & Tools">
        <div className={styles.skillsGrid}>
          {profile.skills.map((group) => (
            <div key={group.category} className={styles.skillGroup}>
              <h3 className={styles.skillCategory}>{group.category}</h3>
              <div className={styles.badgeList}>
                {group.items.map((item) => (
                  <Badge key={item}>{item}</Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Experience ── */}
      <Section title="Experience">
        <div className={styles.timeline}>
          {profile.experience.map((exp, i) => (
            <div key={i} className={styles.timelineItem}>
              <div className={styles.timelineDot} />
              <div className={styles.timelineContent}>
                <div className={styles.timelineHeader}>
                  <span className={styles.timelineRole}>{exp.role}</span>
                  <span className={styles.timelinePeriod}>{exp.period}</span>
                </div>
                <span className={styles.timelineCompany}>{exp.company}</span>
                <p className={styles.timelineDesc}>{exp.description}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Education ── */}
      <Section title="Education">
        <div className={styles.timeline}>
          {profile.education.map((edu, i) => (
            <div key={i} className={styles.timelineItem}>
              <div className={styles.timelineDot} />
              <div className={styles.timelineContent}>
                <div className={styles.timelineHeader}>
                  <span className={styles.timelineRole}>{edu.degree}</span>
                  <span className={styles.timelinePeriod}>{edu.period}</span>
                </div>
                <span className={styles.timelineCompany}>{edu.school}</span>
              </div>
            </div>
          ))}
        </div>
      </Section>
    </PageLayout>
  );
}
