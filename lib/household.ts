import { getSupabaseAdminClient } from "./supabase-admin";

type MinimalUser = {
  id: string;
  email?: string | null;
};

type HouseholdRow = {
  id: string;
  owner_user_id: string;
  partner_email: string | null;
  created_at: string;
};

type HouseholdMemberRow = {
  household_id: string;
  user_id: string;
  role: "owner" | "partner";
};

export type HouseholdMember = {
  user_id: string;
  email: string | null;
  role: "owner" | "partner";
};

export type HouseholdContext = {
  user: MinimalUser;
  household: {
    id: string;
    owner_user_id: string;
    partner_email: string | null;
    created_at: string;
    members: HouseholdMember[];
  } | null;
  memberUserIds: string[];
  canManageHousehold: boolean;
};

export function normalizeEmail(email?: string | null) {
  return email?.trim().toLowerCase() || null;
}

async function findAuthUserByEmail(email: string) {
  const admin = getSupabaseAdminClient();
  const normalized = normalizeEmail(email);
  if (!normalized) return null;

  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (error) throw error;

  return data.users.find((candidate) => normalizeEmail(candidate.email) === normalized) ?? null;
}

async function getUserEmail(userId: string) {
  const admin = getSupabaseAdminClient();
  const { data, error } = await admin.auth.admin.getUserById(userId);
  if (error) return null;
  return data.user.email ?? null;
}

async function ensureOwnerMembership(householdId: string, ownerUserId: string) {
  const admin = getSupabaseAdminClient();
  const { data } = await admin
    .from("household_members")
    .select("household_id")
    .eq("household_id", householdId)
    .eq("user_id", ownerUserId)
    .maybeSingle();

  if (!data) {
    await admin.from("household_members").insert({
      household_id: householdId,
      user_id: ownerUserId,
      role: "owner",
    });
  }
}

export async function syncPartnerMembership(householdId: string, partnerEmail?: string | null) {
  const admin = getSupabaseAdminClient();
  const normalized = normalizeEmail(partnerEmail);

  if (!normalized) {
    return null;
  }

  const partner = await findAuthUserByEmail(normalized);
  if (!partner) {
    return null;
  }

  const { data: existing } = await admin
    .from("household_members")
    .select("household_id")
    .eq("household_id", householdId)
    .eq("user_id", partner.id)
    .maybeSingle();

  if (!existing) {
    await admin.from("household_members").insert({
      household_id: householdId,
      user_id: partner.id,
      role: "partner",
    });
  }

  return partner.id;
}

async function getMembershipForUser(userId: string) {
  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from("household_members")
    .select("household_id,user_id,role")
    .eq("user_id", userId)
    .maybeSingle<HouseholdMemberRow>();

  if (error) throw error;
  return data;
}

async function getHouseholdRow(householdId: string) {
  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from("households")
    .select("id,owner_user_id,partner_email,created_at")
    .eq("id", householdId)
    .maybeSingle<HouseholdRow>();

  if (error) throw error;
  return data;
}

async function listMembers(householdId: string) {
  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from("household_members")
    .select("household_id,user_id,role")
    .eq("household_id", householdId)
    .returns<HouseholdMemberRow[]>();

  if (error) throw error;

  const rows = data ?? [];
  const emails = await Promise.all(rows.map((row) => getUserEmail(row.user_id)));

  return rows.map((row, index) => ({
    user_id: row.user_id,
    email: emails[index],
    role: row.role,
  }));
}

export async function getHouseholdContext(user: MinimalUser): Promise<HouseholdContext> {
  const admin = getSupabaseAdminClient();
  const userEmail = normalizeEmail(user.email);

  let membership = await getMembershipForUser(user.id);

  if (!membership && userEmail) {
    const { data: invitedHousehold, error } = await admin
      .from("households")
      .select("id,owner_user_id,partner_email,created_at")
      .eq("partner_email", userEmail)
      .maybeSingle<HouseholdRow>();

    if (error) throw error;

    if (invitedHousehold) {
      await syncPartnerMembership(invitedHousehold.id, userEmail);
      membership = await getMembershipForUser(user.id);
    }
  }

  if (!membership) {
    return {
      user,
      household: null,
      memberUserIds: [user.id],
      canManageHousehold: true,
    };
  }

  const household = await getHouseholdRow(membership.household_id);
  if (!household) {
    return {
      user,
      household: null,
      memberUserIds: [user.id],
      canManageHousehold: true,
    };
  }

  await ensureOwnerMembership(household.id, household.owner_user_id);
  const members = await listMembers(household.id);

  return {
    user,
    household: {
      ...household,
      members,
    },
    memberUserIds: members.map((member) => member.user_id),
    canManageHousehold: household.owner_user_id === user.id,
  };
}

export async function createOrUpdateHousehold(user: MinimalUser, partnerEmail?: string | null) {
  const admin = getSupabaseAdminClient();
  const normalizedPartnerEmail = normalizeEmail(partnerEmail);
  const context = await getHouseholdContext(user);

  if (context.household && !context.canManageHousehold) {
    throw new Error("Apenas o criador do planejamento pode atualizar o vínculo do cônjuge.");
  }

  const selfEmail = normalizeEmail(user.email);
  if (normalizedPartnerEmail && selfEmail && normalizedPartnerEmail === selfEmail) {
    throw new Error("O e-mail do cônjuge deve ser diferente do usuário criador.");
  }

  let householdId = context.household?.id;

  if (!householdId) {
    const { data, error } = await admin
      .from("households")
      .insert({
        owner_user_id: user.id,
        partner_email: normalizedPartnerEmail,
      })
      .select("id")
      .single<{ id: string }>();

    if (error) throw error;

    householdId = data.id;
    await admin.from("household_members").insert({
      household_id: householdId,
      user_id: user.id,
      role: "owner",
    });
  } else {
    const { error } = await admin
      .from("households")
      .update({
        partner_email: normalizedPartnerEmail,
      })
      .eq("id", householdId);

    if (error) throw error;
  }

  if (normalizedPartnerEmail) {
    await syncPartnerMembership(householdId, normalizedPartnerEmail);
  }

  return getHouseholdContext(user);
}

export async function listVisibleCategories(context: HouseholdContext) {
  const admin = getSupabaseAdminClient();
  const userIds = context.memberUserIds;

  const { data: sharedRows, error: sharedError } = await admin
    .from("categories")
    .select("id,name,user_id")
    .is("user_id", null)
    .order("name");

  if (sharedError) throw sharedError;

  let householdRows: Array<{ id: string; name: string; user_id: string | null }> = [];
  if (userIds.length > 0) {
    const { data, error } = await admin
      .from("categories")
      .select("id,name,user_id")
      .in("user_id", userIds)
      .order("name");

    if (error) throw error;
    householdRows = data ?? [];
  }

  const merged = [...(sharedRows ?? []), ...householdRows];
  const seen = new Set<string>();

  return merged.filter((row) => {
    if (seen.has(row.id)) return false;
    seen.add(row.id);
    return true;
  });
}

export async function userCanManageCategory(categoryId: string, context: HouseholdContext) {
  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from("categories")
    .select("id,user_id")
    .eq("id", categoryId)
    .maybeSingle<{ id: string; user_id: string | null }>();

  if (error) throw error;
  if (!data || !data.user_id) return false;

  return context.memberUserIds.includes(data.user_id);
}
