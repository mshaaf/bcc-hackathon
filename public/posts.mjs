// Threaded posts (community conversation and mission discussion): rendering, reply, edit and hide.
import { buildThreads, describeError, postActions } from "/lib/community.mjs";
import { POST_KINDS, newMissionHash } from "/lib/mission.mjs";
import { app, clearDraft, el, emit, errorFor, focusKey, fullFormat, isModerator, isOrganizer, missionById, sendDraft, setDraft, setError, textForm, timeFormat } from "/shell.mjs";

const ui = { editing: new Set(), replying: new Set(), confirmingHide: null };
// emit() renders synchronously, so focus can move right away (keyboard and scripted input both rely on it).
const afterRender = fn => fn();

function badge(text, className = "badge") { return el("span", className, text); }

// scope: { missionId: string|null }. In a mission, its organizer can also hide posts.
export function renderThreads(host, posts, { missionId = null, linkMissions = false, offerMission = false } = {}) {
  const threads = buildThreads(posts);
  const mission = missionId ? missionById(missionId) : null;
  const canModerate = isModerator() || (mission && isOrganizer(mission));
  const bySource = new Map();
  if (linkMissions) for (const item of app.missions) if (item.sourcePostId) bySource.set(item.sourcePostId, [...(bySource.get(item.sourcePostId) ?? []), item]);

  const postNode = (post, { replyable }) => {
    const actions = postActions(post, { userId: app.userId, isModerator: canModerate });
    const item = el("li", post.parentId ? "post reply" : "post");
    item.dataset.postId = post.id;
    if (post.kind !== "discussion") item.dataset.kind = post.kind;
    const head = el("header", "post-head");
    head.append(el("strong", "post-author", post.authorName));
    if (post.authorId === app.userId) head.append(badge("you"));
    if (post.authorId === app.community?.moderatorId) head.append(badge("moderator", "badge badge-demo"));
    if (mission && post.authorId === mission.organizerId) head.append(badge("organizer", "badge badge-demo"));
    if (post.kind !== "discussion") head.append(badge(POST_KINDS[post.kind], `badge kind-${post.kind}`));
    const time = el("time", "post-time", timeFormat.format(new Date(post.createdAt)));
    time.dateTime = post.createdAt; time.title = fullFormat.format(new Date(post.createdAt));
    head.append(time);
    if (post.edited && !post.hidden) head.append(el("span", "post-edited", "edited"));
    item.append(head);
    if (post.kind === "observation" && !post.hidden) {
      const meta = el("p", "post-meta");
      meta.append(el("strong", "", `Observed ${post.observedOn}`));
      if (post.fictional) meta.append(badge("FICTIONAL practice entry", "badge badge-demo"));
      if (post.imported) meta.append(badge("Imported from a local campaign · original author unverified", "badge badge-warn"));
      item.append(meta);
    }
    const editing = ui.editing.has(post.id) && actions.edit;
    if (post.hidden) item.append(el("p", "post-removed", "This post was hidden by a moderator."));
    else if (!editing) item.append(el("p", "post-body", post.body));
    const bar = el("div", "post-actions");
    const add = (text, handler, label, id) => {
      const button = el("button", "button button-quiet", text);
      button.type = "button";
      button.setAttribute("aria-label", `${label} ${post.authorName}'s post`);
      button.dataset.focusKey = `${id}:${post.id}`;
      button.addEventListener("click", handler);
      bar.append(button);
    };
    if (replyable && actions.reply && !ui.replying.has(post.id)) add("Reply", () => { ui.replying.add(post.id); emit(); afterRender(() => focusKey(`reply:${post.id}`)); }, "Reply to", "reply-btn");
    if (actions.edit && !editing) add("Edit", () => { ui.editing.add(post.id); setDraft(`edit:${post.id}`, post.body); emit(); afterRender(() => focusKey(`edit:${post.id}`)); }, "Edit", "edit-btn");
    if (actions.hide && ui.confirmingHide !== post.id) add("Hide", () => { ui.confirmingHide = post.id; emit(); afterRender(() => focusKey(`hide-yes:${post.id}`)); }, "Hide", "hide-btn");
    if (offerMission && replyable && !post.hidden && !missionId) {
      const link = el("a", "button button-quiet", "Start a mission from this");
      link.href = newMissionHash(app.communityId, post.id);
      link.setAttribute("aria-label", `Start a mission from ${post.authorName}'s post`);
      bar.append(link);
    }
    if (bar.children.length) item.append(bar);
    if (replyable && bySource.has(post.id)) {
      const chips = el("ul", "mission-chips");
      for (const linked of bySource.get(post.id)) {
        const chip = el("li");
        const link = el("a", "", `Mission: ${linked.title}`);
        link.href = `#/community/${app.communityId}/mission/${linked.id}`;
        chip.append(link);
        chips.append(chip);
      }
      item.append(chips);
    }
    if (editing) {
      const cancel = () => { ui.editing.delete(post.id); clearDraft(`edit:${post.id}`); setError(`edit:${post.id}`, ""); emit(); afterRender(() => focusKey(`edit-btn:${post.id}`)); };
      item.append(textForm({ key: `edit:${post.id}`, label: "Edit your post", submitLabel: "Save", onCancel: cancel, onSubmit: () => sendDraft(`edit:${post.id}`, body => app.api.editOwnPost(post.id, body), { onDone: () => { ui.editing.delete(post.id); } }) }));
    }
    if (actions.hide && ui.confirmingHide === post.id) {
      const confirm = el("div", "hide-confirm");
      confirm.append(el("p", "", "Hide this post for everyone? Its text is removed from the conversation."));
      const yes = el("button", "button button-primary", "Hide post"); yes.type = "button"; yes.dataset.focusKey = `hide-yes:${post.id}`;
      yes.addEventListener("click", async () => {
        try { await app.api.hidePost(post.id); ui.confirmingHide = null; app.posts = await app.api.listPosts(app.communityId); if (missionId) app.missionPosts = await app.api.listPosts(app.communityId, { missionId }); setError(`hide:${post.id}`, ""); }
        catch (error) { setError(`hide:${post.id}`, describeError(error)); }
        emit();
      });
      const no = el("button", "button button-quiet", "Cancel"); no.type = "button";
      no.addEventListener("click", () => { ui.confirmingHide = null; emit(); afterRender(() => focusKey(`hide-btn:${post.id}`)); });
      confirm.append(yes, no);
      const problem = errorFor(`hide:${post.id}`);
      if (problem) { const alert = el("p", "form-error", problem); alert.setAttribute("role", "alert"); confirm.append(alert); }
      item.append(confirm);
    }
    return item;
  };

  host.replaceChildren(...threads.map(({ post, replies }) => {
    const item = postNode(post, { replyable: true });
    if (replies.length) {
      const list = el("ol", "replies");
      list.setAttribute("aria-label", `Replies to ${post.authorName}`);
      list.append(...replies.map(reply => postNode(reply, { replyable: false })));
      item.append(list);
    }
    if (ui.replying.has(post.id) && !post.hidden) {
      const cancel = () => { ui.replying.delete(post.id); setError(`reply:${post.id}`, ""); emit(); afterRender(() => focusKey(`reply-btn:${post.id}`)); };
      item.append(textForm({
        key: `reply:${post.id}`, label: `Reply to ${post.authorName}`, rows: 2, submitLabel: "Reply", onCancel: cancel,
        onSubmit: () => sendDraft(`reply:${post.id}`, (body, operationId) => app.api.createPost({ communityId: app.communityId, parentId: post.id, missionId, body, operationId }), { onDone: () => { ui.replying.delete(post.id); } })
      }));
    }
    return item;
  }));
  return threads.length;
}
