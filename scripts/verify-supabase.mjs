import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;
const required = [
  "VERIFY_USER_A_EMAIL",
  "VERIFY_USER_A_PASSWORD",
  "VERIFY_USER_B_EMAIL",
  "VERIFY_USER_B_PASSWORD",
];

if (
  !supabaseUrl ||
  !publishableKey ||
  required.some((name) => !process.env[name])
) {
  throw new Error(
    `Set SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, and ${required.join(", ")}.`,
  );
}

function clientFor(emailVariable, passwordVariable) {
  return createClient(supabaseUrl, publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  }).auth.signInWithPassword({
    email: process.env[emailVariable],
    password: process.env[passwordVariable],
  });
}

async function signIn(emailVariable, passwordVariable) {
  const { data, error } = await clientFor(emailVariable, passwordVariable);
  if (error || !data.user || !data.session) {
    throw new Error(
      `Could not sign in ${emailVariable}: ${error?.message ?? "no session"}`,
    );
  }
  return {
    client: createClient(supabaseUrl, publishableKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: {
        headers: { Authorization: `Bearer ${data.session.access_token}` },
      },
    }),
    user: data.user,
  };
}

function check(condition, message) {
  if (!condition) throw new Error(`FAILED: ${message}`);
  console.log(`PASS: ${message}`);
}

async function denied(message, request) {
  const { error } = await request;
  check(Boolean(error), `${message} is denied`);
}

const [userA, userB] = await Promise.all([
  signIn("VERIFY_USER_A_EMAIL", "VERIFY_USER_A_PASSWORD"),
  signIn("VERIFY_USER_B_EMAIL", "VERIFY_USER_B_PASSWORD"),
]);
check(userA.user.id !== userB.user.id, "the two test accounts are distinct");

const seedResult = await userB.client.rpc("submit_result", {
  p_client_result_id: crypto.randomUUID(),
  p_game_id: "noughts-and-crosses",
  p_difficulty: "beginner",
  p_outcome: "win",
  p_match_mode: "computer",
  p_attempts: null,
  p_hints_used: 0,
});
if (seedResult.error) throw seedResult.error;
console.log("PASS: user B created a result through the authorized RPC");

const [otherStats, otherResults, otherEntitlements] = await Promise.all([
  userA.client
    .from("game_stats")
    .select("user_id")
    .eq("user_id", userB.user.id),
  userA.client
    .from("game_results")
    .select("user_id")
    .eq("user_id", userB.user.id),
  userA.client
    .from("entitlements")
    .select("user_id")
    .eq("user_id", userB.user.id),
]);
for (const [label, result] of [
  ["game_stats", otherStats],
  ["game_results", otherResults],
  ["entitlements", otherEntitlements],
]) {
  if (result.error) throw result.error;
  check(result.data.length === 0, `user A cannot read user B ${label}`);
}

await denied(
  "direct game_stats insert",
  userA.client.from("game_stats").insert({
    user_id: userA.user.id,
    game_id: "noughts-and-crosses",
    difficulty: "beginner",
    points: 999999,
  }),
);
await denied(
  "direct game_results insert",
  userA.client.from("game_results").insert({
    user_id: userA.user.id,
    client_result_id: crypto.randomUUID(),
    game_id: "noughts-and-crosses",
    difficulty: "beginner",
    outcome: "win",
    points_awarded: 999999,
  }),
);
await denied(
  "direct entitlement insert",
  userA.client.from("entitlements").insert({
    user_id: userA.user.id,
    feature: "expert_access",
    source: "admin_grant",
    status: "active",
  }),
);
await denied(
  "direct entitlement update",
  userA.client
    .from("entitlements")
    .update({ status: "active" })
    .eq("user_id", userA.user.id),
);
await denied(
  "direct entitlement delete",
  userA.client.from("entitlements").delete().eq("user_id", userA.user.id),
);
await denied(
  "direct Stripe customer insert",
  userA.client.from("stripe_customers").insert({
    user_id: userA.user.id,
    stripe_customer_id: `cus_verify_${userA.user.id}`,
  }),
);
await denied(
  "direct Stripe customer update",
  userA.client
    .from("stripe_customers")
    .update({ stripe_customer_id: "cus_changed" })
    .eq("user_id", userA.user.id),
);
await denied(
  "direct Stripe event insert",
  userA.client.from("stripe_events").insert({
    event_id: `evt_verify_${crypto.randomUUID()}`,
    type: "verification",
  }),
);
await denied(
  "direct Stripe event update",
  userA.client
    .from("stripe_events")
    .update({ status: "processed" })
    .eq("event_id", "evt_verify_missing"),
);

const badGame = await userA.client.rpc("submit_result", {
  p_client_result_id: crypto.randomUUID(),
  p_game_id: "not-a-real-game",
  p_difficulty: "beginner",
  p_outcome: "win",
  p_match_mode: "computer",
  p_attempts: null,
  p_hints_used: 0,
});
check(Boolean(badGame.error), "submit_result rejects an unknown game ID");

const leaderboard = await userA.client
  .from("leaderboard_all_time")
  .select("*")
  .eq("game_id", "overall");
if (leaderboard.error) throw leaderboard.error;
check(leaderboard.data.length > 0, "leaderboard has a test result to inspect");
for (const row of leaderboard.data) {
  check(
    !["user_id", "id", "email"].some((column) => column in row),
    "leaderboard response has no user ID or email columns",
  );
}

console.log("All publishable-key Supabase verification checks passed.");
