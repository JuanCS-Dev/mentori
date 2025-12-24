import { Question } from '../../types';

/**
 * Interleaved Practice Mixer
 * 
 * Based on 2025 finding: 72% vs 38% test scores when using interleaving.
 * Forces strategy selection by mixing different problem types.
 */

export interface InterleaveSection {
    topic: string;
    questions: Question[];
}

/**
 * Mixes questions from multiple topics to create an interleaved practice set.
 * 
 * @param byTopic Map of Topic Name -> Question Array
 * @param mixRatio Probability of switching topics (0.7 = 70% chance to switch)
 *                 High interleave = High cognitive load but better retention.
 */
export function interleaveQuestions(
    byTopic: Map<string, Question[]>,
    mixRatio: number = 0.7
): Question[] {
    // Deep copy to avoid mutating source
    const pools = new Map<string, Question[]>();
    byTopic.forEach((qs, topic) => pools.set(topic, [...qs]));

    const interleaved: Question[] = [];
    // Topics array kept for reference, used in logic
    // const topics = Array.from(pools.keys()); // Removed unused variable
    let lastTopic = '';

    // Continue until all questions are used
    while (pools.size > 0) {
        let chosenTopic = '';

        // Decide whether to switch topic or stay (if possible)
        const shouldSwitch = Math.random() < mixRatio || lastTopic === '';

        // Filter available topics
        const availableTopics = Array.from(pools.keys());

        if (shouldSwitch && availableTopics.length > 1) {
            // Pick a topic different from last one
            const candidates = availableTopics.filter(t => t !== lastTopic);
            chosenTopic = candidates[Math.floor(Math.random() * candidates.length)] ?? availableTopics[0] ?? '';
        } else {
            // Stay on same topic if it still has questions, otherwise pick any
            if (pools.has(lastTopic)) {
                chosenTopic = lastTopic;
            } else {
                chosenTopic = availableTopics[Math.floor(Math.random() * availableTopics.length)] ?? '';
            }
        }

        if (!chosenTopic) break; // Safety break

        // Pull question from chosen topic
        const topicPool = pools.get(chosenTopic)!;
        if (topicPool.length > 0) {
            interleaved.push(topicPool.shift()!);
            lastTopic = chosenTopic;
        }

        // Remove empty pools
        if (topicPool.length === 0) {
            pools.delete(chosenTopic);
        }
    }

    return interleaved;
}
