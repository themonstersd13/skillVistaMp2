export function splitCommaSeparated(raw) {
  return raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

export function splitLines(raw) {
  return raw
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)
}

export function joinList(items) {
  return (items ?? []).join(', ')
}

export function joinLines(items) {
  return (items ?? []).join('\n')
}

export function buildProfileDraft(student) {
  const profile = student.profile ?? {}
  return {
    targetRole: student.target_role ?? '',
    strengths: joinList(student.strengths),
    stretchGoals: joinList(student.stretch_goals),
    headline: profile.headline ?? '',
    preferredLanguages: joinList(profile.preferred_languages),
    currentFocus: joinList(profile.current_focus),
    projectContext: profile.project_context ?? '',
    evidence: joinLines(profile.evidence),
    interviewPreferences: joinList(profile.interview_preferences),
  }
}

export function profileDraftToPayload(profileDraft) {
  return {
    target_role: profileDraft.targetRole,
    strengths: splitCommaSeparated(profileDraft.strengths),
    stretch_goals: splitCommaSeparated(profileDraft.stretchGoals),
    profile: {
      headline: profileDraft.headline,
      preferred_languages: splitCommaSeparated(profileDraft.preferredLanguages),
      current_focus: splitCommaSeparated(profileDraft.currentFocus),
      project_context: profileDraft.projectContext,
      evidence: splitLines(profileDraft.evidence),
      interview_preferences: splitCommaSeparated(profileDraft.interviewPreferences),
      customized_by_candidate: true,
    },
  }
}
