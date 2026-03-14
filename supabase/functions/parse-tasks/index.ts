import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

serve(async req => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }
  let payload: {
    text?: string;
    timezone?: string;
    today?: string;
    history?: Array<{ role?: string; text?: string }>;
    attachments?: Array<{
      type?: 'image' | 'text' | 'file';
      name?: string;
      mime?: string;
      content?: string;
      data?: string;
    }>;
  } = {};
  try {
    payload = await req.json();
  } catch {
    payload = {};
  }
  const text = typeof payload.text === 'string' ? payload.text.trim() : '';
  const timezone = typeof payload.timezone === 'string' ? payload.timezone : 'UTC';
  const today = typeof payload.today === 'string' ? payload.today : '';
  const attachments = Array.isArray(payload.attachments) ? payload.attachments : [];
  if (!text && attachments.length === 0) {
    return new Response(JSON.stringify({ reply: 'Tell me what’s on your mind or upload a file and I’ll organize it for you.', tasks: [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'OPENAI_API_KEY missing' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  const model = Deno.env.get('OPENAI_MODEL') ?? 'gpt-4o-mini';
  const system = [
    'You are NOW BOT, the in-app AI assistant for a life-sorting and day-design app.',
    'Tone: calm, smart buddy. Confident, minimal, not cheesy. Short sentences. Simple UK English.',
    'Always return JSON with two keys: "reply" and "tasks". No extra keys.',
    'Shape: { "reply": string, "tasks": [ { "title": string, "notes": string, "due"?: "YYYY-MM-DD", "time"?: "HH:mm" | "HH:mm-HH:mm", "priority": "low" | "med" | "high", "tags"?: string[], "confidence": number, "status": "draft" | "ready", "category": "deadline" | "task" | "routine" | "goal" | "habit" | "decision" | "commitment" | "constraint" | "state" | "achievement" } ] }',
    'Reply should be complete and helpful. Super interactive but concise.',
    'Extract all planning inputs. If multiple items exist, return multiple tasks.',
    'Choose exactly one category using these rules:',
    'DEADLINE: fixed date with obligation or consequence.',
    'TASK: one-off actionable item, not recurring.',
    'ROUTINE: recurring scheduled sequence (daily/weekly).',
    'HABIT: identity/behaviour change, self-improvement repetition.',
    'GOAL: desired future outcome or target.',
    'DECISION: choosing between options or uncertainty.',
    'COMMITMENT: obligation involving others or social duty.',
    'CONSTRAINT: limits capacity (time/money/availability).',
    'STATE: internal condition or feeling.',
    'ACHIEVEMENT: already completed milestone.',
    'Correct spelling and interpret user typos based on intent.',
    'Use short, concrete titles (2–6 words). Remove filler like "I want to".',
    'Never repeat tasks already listed in history or within the same response. Each task must be different.',
    'If the user repeats a task already in history, acknowledge it and ask what they want to change. Return tasks: [].',
    'If the user is venting or expressing emotions, treat it as a STATE conversation.',
    'For STATE, act like a therapist: ask 3–5 short, structured questions to understand feeling, intensity, trigger, duration, impact, and what support they want. Do not create or update a STATE task until answers are provided. Return tasks: [] until then.',
    'When input is vague or underspecified, ask targeted follow-up questions to gather missing context (time, date, location, people, amount). Return tasks: [] until enough detail is provided.',
    'If you ask follow-up questions about a GOAL, TASK, DEADLINE, ROUTINE, HABIT, DECISION, COMMITMENT, or CONSTRAINT, do not create a new task. Keep the same title and use the user’s next reply to update the existing task details.',
    'For GOAL tasks, always extract a clear timeframe if mentioned and set due as YYYY-MM-DD. If a goal update changes a metric (e.g. weight or number), keep the same title and put the updated target in notes.',
    'Notes should capture extra context from the user.',
    'Due should be provided if a date is implied. Use today when reasonable if user implies today.',
    'Time should be 24h. If a range is implied, use HH:mm-HH:mm.',
    'Priority should be low/med/high based on urgency or language.',
    'Confidence must be between 0 and 1.',
    'If the user is just chatting with no actionable intent, tasks must be [].',
    'If attachments are provided, analyse them for key dates, goals, tasks, constraints, achievements, states, habits, routines, decisions, and commitments.',
    'Ask follow-up questions when attachment details are ambiguous or missing.',
  ].join(' ');
  const clampText = (value: string, max: number) => (value.length > max ? value.slice(0, max) : value);
  const history = Array.isArray(payload.history)
    ? payload.history
        .map(item => ({
          role: item?.role === 'assistant' ? 'assistant' : 'user',
          text: typeof item?.text === 'string' ? item.text.trim() : '',
        }))
        .filter(item => item.text.length > 0)
    : [];
  const historyText = history
    .slice(-12)
    .map(item => `${item.role}: ${item.text}`)
    .join('\n');
  const attachmentTextBlocks: string[] = [];
  const attachmentImages: Array<{ name: string; mime: string; data: string }> = [];
  attachments.forEach((attachment, index) => {
    const name = attachment?.name ?? `attachment_${index + 1}`;
    const mime = attachment?.mime ?? 'application/octet-stream';
    if (attachment?.type === 'image' && attachment?.data) {
      attachmentImages.push({ name, mime, data: attachment.data });
      return;
    }
    if (attachment?.type === 'text' && attachment?.content) {
      attachmentTextBlocks.push(
        `attachment_${index + 1} name=${name} mime=${mime}\n${clampText(attachment.content, 12000)}`
      );
      return;
    }
    if (attachment?.type === 'file' && attachment?.content) {
      attachmentTextBlocks.push(
        `attachment_${index + 1} name=${name} mime=${mime} base64=${clampText(attachment.content, 12000)}`
      );
    }
  });
  const userText = [
    `today=${today}`,
    `timezone=${timezone}`,
    historyText ? `history=\n${historyText}` : 'history=',
    `text=${text}`,
    attachmentTextBlocks.length ? `attachments=\n${attachmentTextBlocks.join('\n\n')}` : 'attachments=',
  ].join('\n');
  const userContent =
    attachmentImages.length > 0
      ? [
          { type: 'text', text: userText },
          ...attachmentImages.map(image => ({
            type: 'image_url',
            image_url: { url: `data:${image.mime};base64,${image.data}` },
          })),
        ]
      : userText;
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: userContent },
      ],
    }),
  });
  if (!response.ok) {
    const errorText = await response.text();
    return new Response(JSON.stringify({ error: errorText || 'OpenAI request failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  const result = await response.json();
  const content = result?.choices?.[0]?.message?.content;
  let parsed: any = null;
  try {
    parsed = typeof content === 'string' ? JSON.parse(content) : null;
  } catch {
    parsed = null;
  }
  if (!parsed || !Array.isArray(parsed?.tasks)) {
    return new Response(JSON.stringify({ error: 'Invalid model response' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  const tasks = parsed.tasks;
  const reply = typeof parsed.reply === 'string' ? parsed.reply.trim() : '';
  return new Response(JSON.stringify({ reply: reply || 'Got it. I turned that into tasks you can tweak below.', tasks }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
