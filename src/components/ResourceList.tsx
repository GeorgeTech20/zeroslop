import type { LatestEvaluation, Resource } from "@/lib/types";
import { explainRecommendation } from "@/lib/resource-explanations";
import styles from "./ResourceList.module.css";

interface ResourceListProps {
  resources: Resource[];
  evaluation: LatestEvaluation;
}

export function ResourceList({ resources, evaluation }: ResourceListProps) {
  if (resources.length === 0) return null;

  return (
    <ul className={styles.list}>
      {resources.map((resource) => (
        <li key={resource._id} className={styles.item}>
          <a
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.title}
          >
            {resource.title}
          </a>
          <p className={styles.reason}>
            {explainRecommendation(resource, evaluation)}
          </p>
        </li>
      ))}
    </ul>
  );
}
