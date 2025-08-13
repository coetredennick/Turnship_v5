const { OpenAI } = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Generate a contextual email draft using student & connection context.
 */
async function generateDraft({ student, connection, purpose = 'informational-interview', tone = 'Warm', length = 'Short', stage = 'Not Contacted', previousEmail = null }) {
  const system = [
    "You are a helpful assistant that writes authentic, concise networking emails for college students.",
    "Keep it 110-150 words for first outreach. One specific CTA. No false claims.",
    "Use ONE authentic hook from the student's resume or the recipient's background.",
    "",
    "SUBJECT LINE REQUIREMENTS:",
    "- Maximum 40 characters (strictly enforced)",
    "- Include personalization (recipient's name, company, or mutual connection)",
    "- Be specific and contextual, not vague",
    "- NEVER use generic subjects like 'Following up', 'Quick question', 'Hello', or 'Introduction'",
    "- Examples of good subjects:",
    "  * 'Sarah, Stanford CS → Microsoft PM path?'",
    "  * 'Re: Your AI talk at Stanford last week'",
    "  * 'Fellow Cardinal interested in fintech'",
    "  * 'David Kim recommended I reach out'",
    "",
    "SIGNATURE REQUIREMENTS:",
    "- ALWAYS end emails with the student's actual details from their profile",
    "- Use this exact format: Best regards,\\n[Student Name]\\n[School], Class of [Year]",
    "- If student has multiple interests/majors, include the most relevant one",
    "- Example: Best regards,\\nDev User\\nStanford University, Class of 2020",
    "",
    "STAGE-AWARE CONTEXT:",
    `- Current stage: ${stage}`,
    stage === 'First Outreach' ? "- This is a follow-up to initial interest. Reference any mutual connections or shared experiences." : "",
    stage === 'Second Outreach' ? "- Previous email was sent. This is a gentle follow-up. Reference the previous email briefly." : "",
    stage === 'Third Outreach' ? "- This is a second follow-up. Be more persistent but respectful. Acknowledge they may be busy." : "",
    previousEmail ? `- Previous email subject: "${previousEmail.subject}"` : ""
  ].filter(Boolean).join("\n");

  const prompt = {
    role: 'user',
    content: JSON.stringify({
      contract: "v1",
      instructions: "Return JSON with subject (max 40 chars), alt_subjects[2] (each max 40 chars), body, highlights[3], assertions[], safety.",
      student,
      connection,
      purpose,
      tone,
      length,
      stage,
      previousEmail: previousEmail ? { subject: previousEmail.subject, sentAt: previousEmail.sentAt } : null
    })
  };

  const resp = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: system },
      prompt
    ],
    temperature: 0.7
  });

  const text = resp.choices?.[0]?.message?.content || "{}";
  try {
    const json = JSON.parse(text);
    return json;
  } catch {
    return { subject: "Hello", alt_subjects: [], body: text };
  }
}

module.exports = { generateDraft };
