export function buildFollowUpGuidanceContext(input: {
  rawInput: string;
  intakeAnswers: Record<string, string>;
  followUpQuestion: {
    intent: string;
    question: string;
  };
  answer: string;
}) {
  const sanitizedAnswer = input.answer.trim();
  const followUpKey = `follow_up_${input.followUpQuestion.intent}`;
  const appendedContext = [
    input.rawInput.trim(),
    '',
    `Clarifying question: ${input.followUpQuestion.question}`,
    `Clarifying answer: ${sanitizedAnswer}`,
  ]
    .filter((segment) => segment.length > 0)
    .join('\n');

  return {
    rawInput: appendedContext,
    intakeAnswers: {
      ...input.intakeAnswers,
      [followUpKey]: sanitizedAnswer,
    },
  };
}
