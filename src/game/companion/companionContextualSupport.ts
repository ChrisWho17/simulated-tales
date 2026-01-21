// ============================================================================
// COMPANION CONTEXTUAL SUPPORT - Knowledge-based support/interference system
// ============================================================================

import type { 
  CompanionState, 
  ConversationTopic, 
  SituationType,
  ContextualSupportResult 
} from './companionTypes';

// ============================================================================
// SITUATION-TO-TOPIC MAPPING
// ============================================================================

const SITUATION_TOPIC_MAP: Record<SituationType, ConversationTopic[]> = {
  combat_start: ['courage', 'fears', 'motivation'],
  combat_losing: ['courage', 'fears', 'loss', 'motivation'],
  combat_won: ['courage', 'dreams', 'motivation'],
  near_death: ['fears', 'loss', 'future', 'love', 'relationships'],
  difficult_choice: ['philosophy', 'regrets', 'motivation', 'origin'],
  moral_dilemma: ['philosophy', 'regrets', 'origin', 'secrets'],
  negotiation: ['relationships', 'secrets', 'motivation', 'courage'],
  intimidation: ['fears', 'courage', 'secrets', 'origin'],
  emotional_moment: ['love', 'loss', 'relationships', 'memories', 'fears'],
  failure: ['regrets', 'fears', 'motivation', 'courage'],
  success: ['dreams', 'motivation', 'courage', 'future'],
  danger_ahead: ['fears', 'courage', 'motivation', 'future'],
  meeting_stranger: ['relationships', 'origin', 'secrets', 'philosophy'],
  facing_enemy: ['courage', 'fears', 'loss', 'motivation', 'regrets'],
  moment_of_doubt: ['fears', 'philosophy', 'motivation', 'dreams', 'regrets'],
  celebration: ['dreams', 'relationships', 'love', 'memories', 'future'],
};

// ============================================================================
// CONTEXTUAL SUPPORT DIALOGUE
// ============================================================================

// Supportive dialogue by topic and situation
const SUPPORTIVE_DIALOGUE: Record<ConversationTopic, Record<SituationType, string[]>> = {
  dreams: {
    combat_start: [`Remember your dreams. Fight for them.`],
    combat_losing: [`Don't let your dreams die here!`],
    combat_won: [`One step closer to your dreams.`],
    near_death: [`Your dreams are waiting. Hold on!`],
    difficult_choice: [`Think of what you've always wanted. Let that guide you.`],
    moral_dilemma: [`What would the person you wanted to become do?`],
    negotiation: [`You have dreams worth fighting for. Don't settle.`],
    intimidation: [`Your dreams make you stronger than they know.`],
    emotional_moment: [`*quietly* I know what you dream of. It's beautiful.`],
    failure: [`Dreams survive failure. So will you.`],
    success: [`This is what dreams look like coming true.`],
    danger_ahead: [`Your dreams lie beyond this danger. Let's reach them.`],
    meeting_stranger: [`Remember who you want to become.`],
    facing_enemy: [`They can't take your dreams from you.`],
    moment_of_doubt: [`You told me your dreams once. They're worth believing in.`],
    celebration: [`To dreams—and to making them real.`],
  },
  fears: {
    combat_start: [`I know what you fear. This isn't it. Fight!`],
    combat_losing: [`Face this fear like you've faced others!`],
    combat_won: [`Fear conquered. Well done.`],
    near_death: [`Your fears are just fears. You're stronger.`],
    difficult_choice: [`Don't let fear choose for you.`],
    moral_dilemma: [`I know your fears. Don't let them win.`],
    negotiation: [`They can't use your fears against you. Not anymore.`],
    intimidation: [`*steady* I know what really scares you. This isn't it.`],
    emotional_moment: [`*supportive* Your fears don't define you.`],
    failure: [`Fear of failure is worse than failure itself.`],
    success: [`See? Fear didn't stop you.`],
    danger_ahead: [`Your fears are behind you. Let's go forward.`],
    meeting_stranger: [`No need to fear. I'm here.`],
    facing_enemy: [`They don't know your true fears. That's your armor.`],
    moment_of_doubt: [`I know what haunts you. This isn't that. Trust yourself.`],
    celebration: [`To conquering fears—one by one.`],
  },
  motivation: {
    combat_start: [`Remember why you fight!`],
    combat_losing: [`Your reason for fighting hasn't changed. Keep going!`],
    combat_won: [`Your motivation carried you through.`],
    near_death: [`What you fight for—it needs you. Stay.`],
    difficult_choice: [`Think of what drives you. The answer is there.`],
    moral_dilemma: [`Your true motivation will guide you right.`],
    negotiation: [`You know what you're fighting for. Don't compromise.`],
    intimidation: [`They can't shake what drives you.`],
    emotional_moment: [`*knowing nod* I understand why you do this now.`],
    failure: [`Your motivation survives failure. Try again.`],
    success: [`This is why you fight. Never forget it.`],
    danger_ahead: [`What motivates you lies beyond. Let's get there.`],
    meeting_stranger: [`Remember what keeps you going.`],
    facing_enemy: [`Your purpose is stronger than their hate.`],
    moment_of_doubt: [`You told me what drives you. It's still there.`],
    celebration: [`To what keeps us moving—always forward.`],
  },
  loss: {
    combat_start: [`Fight for those you've lost. Honor them.`],
    combat_losing: [`Don't add to your losses. Keep fighting!`],
    combat_won: [`Victory for those who couldn't be here.`],
    near_death: [`Those you lost would want you to live.`],
    difficult_choice: [`What would those you lost advise?`],
    moral_dilemma: [`Loss taught you what matters. Trust that.`],
    negotiation: [`You've lost enough. Don't lose this too.`],
    intimidation: [`After what you've lost, this is nothing.`],
    emotional_moment: [`*gently* I know who you carry with you.`],
    failure: [`Loss taught you resilience. Use it.`],
    success: [`Those you lost would be proud.`],
    danger_ahead: [`We won't add to the losses today.`],
    meeting_stranger: [`Trust carefully. You know the cost of loss.`],
    facing_enemy: [`They can't touch what you've already lost.`],
    moment_of_doubt: [`You've survived loss before. You'll survive this.`],
    celebration: [`To those we've lost—and those still here.`],
  },
  courage: {
    combat_start: [`You've been brave before. Be brave again.`],
    combat_losing: [`Courage doesn't mean winning. It means not quitting!`],
    combat_won: [`Courage rewarded. As it should be.`],
    near_death: [`*fierce* You're too brave to die here!`],
    difficult_choice: [`The brave choice isn't always easy. You know that.`],
    moral_dilemma: [`Courage means doing right, even when it's hard.`],
    negotiation: [`Stand firm. Your courage speaks louder than words.`],
    intimidation: [`I've seen your courage. They haven't. Advantage: you.`],
    emotional_moment: [`*proud* Your courage inspires me.`],
    failure: [`Even the bravest fail. It's getting back up that matters.`],
    success: [`That's the courage I knew was in you.`],
    danger_ahead: [`You've done brave things before. One more won't hurt.`],
    meeting_stranger: [`Be confident. You've earned the right to be.`],
    facing_enemy: [`You're braver than they know. I know the stories.`],
    moment_of_doubt: [`You told me about your courage. Don't forget it now.`],
    celebration: [`To bravery—yours especially.`],
  },
  love: {
    combat_start: [`Love gives you something to protect. Use it.`],
    combat_losing: [`Think of love—fight for it!`],
    combat_won: [`Love won today. Your kind of love.`],
    near_death: [`Love is waiting for you. Don't go yet.`],
    difficult_choice: [`What would love tell you to do?`],
    moral_dilemma: [`Let love guide you. Not anger.`],
    negotiation: [`You know what love means. Fight for what matters.`],
    intimidation: [`You've loved deeply. That makes you stronger, not weaker.`],
    emotional_moment: [`*gently* I know about love in your life. It shows.`],
    failure: [`Love survives failure. So will you.`],
    success: [`Love brought you here. Remember that.`],
    danger_ahead: [`Love is worth facing danger for.`],
    meeting_stranger: [`Your capacity for love is a strength. Don't hide it.`],
    facing_enemy: [`They can't understand what love gives you.`],
    moment_of_doubt: [`Love is real. You told me. Hold onto that.`],
    celebration: [`To love—past, present, and future.`],
  },
  secrets: {
    combat_start: [`Your secrets are safe with me. Focus on the fight.`],
    combat_losing: [`I know things about you. Fight like they matter!`],
    combat_won: [`Your secrets helped make you who you are. And you won.`],
    near_death: [`Your secrets—I'll protect them. But you have to live.`],
    difficult_choice: [`I know your secrets. This choice is yours alone.`],
    moral_dilemma: [`Your secret self knows the answer. Listen to it.`],
    negotiation: [`I'll never betray your confidence. Use that trust.`],
    intimidation: [`They don't know what I know about you. That's power.`],
    emotional_moment: [`*loyal* Your secrets are safe. Always.`],
    failure: [`Your secrets don't make you a failure. This moment doesn't either.`],
    success: [`Success, and your secrets remain yours.`],
    danger_ahead: [`I'll guard what you've shared with my life.`],
    meeting_stranger: [`Be careful what you reveal. Trust is earned.`],
    facing_enemy: [`They know nothing about the real you. Advantage: ours.`],
    moment_of_doubt: [`Your secrets are part of you. And I accept you.`],
    celebration: [`To secrets kept—and trust honored.`],
  },
  regrets: {
    combat_start: [`No new regrets today. Fight clean.`],
    combat_losing: [`Don't add 'giving up' to your regrets!`],
    combat_won: [`No regrets here. You did what you had to.`],
    near_death: [`Live—so you can make peace with your regrets.`],
    difficult_choice: [`Make the choice you won't regret. You know what that is.`],
    moral_dilemma: [`Learn from old regrets. Don't create new ones.`],
    negotiation: [`No regrets. Stand your ground.`],
    intimidation: [`You've faced regret before. This is nothing.`],
    emotional_moment: [`*understanding* I know your regrets. They don't define you.`],
    failure: [`Regret is for things we don't try to fix. Try again.`],
    success: [`One less thing to regret.`],
    danger_ahead: [`Face this. Regret living small, not dying brave.`],
    meeting_stranger: [`New people. New chances. Fewer regrets.`],
    facing_enemy: [`Don't let them add to your regrets.`],
    moment_of_doubt: [`Your regrets taught you wisdom. Use it.`],
    celebration: [`To no regrets—or at least fewer.`],
  },
  origin: {
    combat_start: [`Remember where you came from. Fight like it matters.`],
    combat_losing: [`You've overcome your past before. Do it again!`],
    combat_won: [`Your origin forged you for this. Well done.`],
    near_death: [`Your story isn't over. You came from nothing—survive this.`],
    difficult_choice: [`Think of your journey. What would that person choose?`],
    moral_dilemma: [`Your origin taught you values. Use them.`],
    negotiation: [`You know hardship. Don't settle for less than you're worth.`],
    intimidation: [`Your past made you strong. Show them.`],
    emotional_moment: [`*respectful* Knowing where you're from... I understand you.`],
    failure: [`You've risen from worse beginnings.`],
    success: [`Look how far you've come from where you started.`],
    danger_ahead: [`Your origin prepared you for this. Let's go.`],
    meeting_stranger: [`Your past made you who you are. Trust that.`],
    facing_enemy: [`They don't know your story. That's your advantage.`],
    moment_of_doubt: [`You became you despite your origin. That's strength.`],
    celebration: [`To growth—and to how far you've come.`],
  },
  relationships: {
    combat_start: [`Think of the people who matter. Fight for them.`],
    combat_losing: [`The people who love you—fight to see them again!`],
    combat_won: [`The ones who care about you would be proud.`],
    near_death: [`The people in your life need you. Hold on!`],
    difficult_choice: [`What would the people who love you advise?`],
    moral_dilemma: [`Think of those who shaped you. Honor them.`],
    negotiation: [`You have people depending on you. Be strong.`],
    intimidation: [`You're not alone. The weight of that matters.`],
    emotional_moment: [`*caring* I know about the people in your life. You're loved.`],
    failure: [`The people who care about you won't abandon you now.`],
    success: [`Share this victory with those who matter.`],
    danger_ahead: [`For the people in your life—let's get through this.`],
    meeting_stranger: [`Trust carefully. You have people worth protecting.`],
    facing_enemy: [`They can't break the bonds you've built.`],
    moment_of_doubt: [`The people who love you believe in you.`],
    celebration: [`To the people who matter. And to you for earning them.`],
  },
  memories: {
    combat_start: [`Hold onto your happiest memory. Fight for more like it.`],
    combat_losing: [`Remember the good times—fight to create more!`],
    combat_won: [`Another good memory in the making.`],
    near_death: [`Your best memories—there are more waiting. Stay.`],
    difficult_choice: [`Think of your happiest moment. What led there?`],
    moral_dilemma: [`Make a choice your future self will remember fondly.`],
    negotiation: [`Your best memories prove your worth. Know it.`],
    intimidation: [`Good memories fuel confidence. Use it.`],
    emotional_moment: [`*smiling* That memory you shared... I treasure it.`],
    failure: [`One bad moment doesn't erase good memories.`],
    success: [`This will be a good memory someday.`],
    danger_ahead: [`More memories waiting on the other side. Let's make them.`],
    meeting_stranger: [`New memories start with new people.`],
    facing_enemy: [`They can't touch your happiest memories.`],
    moment_of_doubt: [`Your best memories prove you can be happy. Believe that.`],
    celebration: [`Making new memories tonight. Cheers.`],
  },
  future: {
    combat_start: [`Your future is on the other side. Fight for it.`],
    combat_losing: [`You have plans! A future! Don't stop now!`],
    combat_won: [`One step closer to the future you want.`],
    near_death: [`Your future isn't written yet. Stay.`],
    difficult_choice: [`What serves your future best?`],
    moral_dilemma: [`Build a future you can be proud of.`],
    negotiation: [`You have a future to protect. Stand firm.`],
    intimidation: [`Your vision of tomorrow gives you power.`],
    emotional_moment: [`*hopeful* I want to see you reach that future.`],
    failure: [`The future isn't cancelled. Keep going.`],
    success: [`Your future is brighter today.`],
    danger_ahead: [`The future is waiting. Let's reach it together.`],
    meeting_stranger: [`They might be part of your future. Be open.`],
    facing_enemy: [`They can't steal your future.`],
    moment_of_doubt: [`Your future is still possible. I believe that.`],
    celebration: [`To the future—and everything it holds.`],
  },
  philosophy: {
    combat_start: [`Your beliefs give you strength. Fight with conviction.`],
    combat_losing: [`What you believe matters. Don't give up!`],
    combat_won: [`Your philosophy guided you to victory.`],
    near_death: [`If you believe in fate—it says: not yet.`],
    difficult_choice: [`Let your beliefs guide you. They haven't failed you.`],
    moral_dilemma: [`Your philosophy has the answer. Listen to it.`],
    negotiation: [`Stand by what you believe. It matters.`],
    intimidation: [`They can't shake your convictions.`],
    emotional_moment: [`*thoughtful* Your beliefs make you who you are.`],
    failure: [`Your philosophy survives failure.`],
    success: [`Proof that your beliefs have merit.`],
    danger_ahead: [`Your beliefs have carried you this far.`],
    meeting_stranger: [`Judge by your values. They've served you well.`],
    facing_enemy: [`Your convictions are stronger than their hate.`],
    moment_of_doubt: [`You told me what you believe. Believe it now.`],
    celebration: [`To principles—and those who hold them.`],
  },
  peace: {
    combat_start: [`Fight for the peace that waits after.`],
    combat_losing: [`Peace lies on the other side. Keep fighting!`],
    combat_won: [`One step closer to that peace you seek.`],
    near_death: [`Peace is waiting. But not that kind. Stay.`],
    difficult_choice: [`Choose what brings lasting peace.`],
    moral_dilemma: [`What choice leads to inner peace?`],
    negotiation: [`Negotiate for the peace you deserve.`],
    intimidation: [`Your inner peace makes you unshakable.`],
    emotional_moment: [`*calm* I hope you find that peace you described.`],
    failure: [`Peace with failure is part of life.`],
    success: [`Success brings its own peace.`],
    danger_ahead: [`Peace awaits beyond this danger.`],
    meeting_stranger: [`Approach with peace. It's your strength.`],
    facing_enemy: [`They can't disturb your inner peace.`],
    moment_of_doubt: [`Find that center of calm you told me about.`],
    celebration: [`To peace—earned, not given.`],
  },
  wanderlust: {
    combat_start: [`There are places to see. Win this first.`],
    combat_losing: [`The world is vast. Don't leave it yet!`],
    combat_won: [`Now—where to next?`],
    near_death: [`So many places unseen. Stay.`],
    difficult_choice: [`Think of all you haven't explored yet.`],
    moral_dilemma: [`The journey continues after this choice.`],
    negotiation: [`Negotiate for the freedom to wander.`],
    intimidation: [`A traveler fears nothing for long.`],
    emotional_moment: [`*dreamily* I hope we reach those places you dream of.`],
    failure: [`Every journey has setbacks. Keep moving.`],
    success: [`Success opens new horizons.`],
    danger_ahead: [`Adventure awaits beyond this.`],
    meeting_stranger: [`New people, new stories, new places.`],
    facing_enemy: [`They're just a stop on the journey.`],
    moment_of_doubt: [`The road continues. As do we.`],
    celebration: [`To wandering—and finding along the way.`],
  },
};

// Hostile dialogue by topic and situation
const HOSTILE_DIALOGUE: Record<ConversationTopic, Record<SituationType, string[]>> = {
  dreams: {
    combat_start: [`Those dreams you mentioned? They die here.`],
    combat_losing: [`*sneering* Some dreamer you turned out to be.`],
    combat_won: [`Dreams don't mean much when you fight dirty.`],
    near_death: [`*cold* Dream your last dream.`],
    difficult_choice: [`Your 'dreams' were always delusions.`],
    moral_dilemma: [`Your dreams can't save you from this.`],
    negotiation: [`Those dreams you shared? I'll use them against you.`],
    intimidation: [`*threatening* I know your dreams. I can destroy them.`],
    emotional_moment: [`*mocking* Still clinging to those sad dreams?`],
    failure: [`Your dreams led here. To failure.`],
    success: [`Success won't make those dreams real.`],
    danger_ahead: [`Your dreams won't protect you from what's coming.`],
    meeting_stranger: [`Shall I tell them about your pathetic dreams?`],
    facing_enemy: [`I told them what you dream of. They laughed.`],
    moment_of_doubt: [`Doubt those dreams. I do.`],
    celebration: [`Celebrate your delusions while you can.`],
  },
  fears: {
    combat_start: [`I know your fears. *smiles* This should be fun.`],
    combat_losing: [`Giving in to fear, as expected.`],
    combat_won: [`Fear will catch you eventually.`],
    near_death: [`*cruel* Your fears are coming true.`],
    difficult_choice: [`I know what you're afraid of. Choose wisely.`],
    moral_dilemma: [`Fear is making this choice for you.`],
    negotiation: [`*threatening* I know what scares you most.`],
    intimidation: [`Your fears? I could make them real.`],
    emotional_moment: [`*cold* Those fears you shared were useful.`],
    failure: [`Fear of failure became actual failure.`],
    success: [`Success won't quiet your fears forever.`],
    danger_ahead: [`I told them what you fear. They'll use it.`],
    meeting_stranger: [`Should I reveal your fears to them?`],
    facing_enemy: [`Your enemies know your fears now. You're welcome.`],
    moment_of_doubt: [`Your fears were always right about you.`],
    celebration: [`Celebrate while your fears lurk.`],
  },
  motivation: {
    combat_start: [`Your 'motivation' is pathetic.`],
    combat_losing: [`Where's that drive now?`],
    combat_won: [`Motivation won't save you forever.`],
    near_death: [`*sneering* Die for your 'cause.'`],
    difficult_choice: [`Your motivation is blinding you.`],
    moral_dilemma: [`Some motivation. Leading you to ruin.`],
    negotiation: [`I know what drives you. Weakness.`],
    intimidation: [`Your motivation can be used against you.`],
    emotional_moment: [`*dismissive* Your motivation is laughable.`],
    failure: [`That motivation of yours? Useless.`],
    success: [`Hollow motivation leads to hollow success.`],
    danger_ahead: [`Your motivation blinds you to danger.`],
    meeting_stranger: [`Let me tell them what really motivates you.`],
    facing_enemy: [`I explained your motivations. They found it pathetic.`],
    moment_of_doubt: [`Doubt your motivation. It deserves it.`],
    celebration: [`Celebrating empty purpose.`],
  },
  loss: {
    combat_start: [`*cruel* About to add to your losses.`],
    combat_losing: [`More loss coming. As usual.`],
    combat_won: [`Victory can't undo what you've lost.`],
    near_death: [`*cold* Join those you've lost.`],
    difficult_choice: [`Your losses cloud your judgment.`],
    moral_dilemma: [`Loss made you weak. This proves it.`],
    negotiation: [`I know your losses. Useful leverage.`],
    intimidation: [`*threatening* I could add to your losses.`],
    emotional_moment: [`*mocking* Still grieving? Pathetic.`],
    failure: [`Add this to your losses.`],
    success: [`Success won't bring them back.`],
    danger_ahead: [`More loss awaits. Fitting.`],
    meeting_stranger: [`Should I tell them about your losses?`],
    facing_enemy: [`I shared your grief with them. They don't care.`],
    moment_of_doubt: [`Your losses define you. Broken.`],
    celebration: [`Celebrating while haunted by loss.`],
  },
  courage: {
    combat_start: [`Let's see if you're as brave as you claimed.`],
    combat_losing: [`Where's that 'courage' you bragged about?`],
    combat_won: [`Lucky. Not brave.`],
    near_death: [`*sneering* Not so brave now, are you?`],
    difficult_choice: [`Your so-called 'courage' is just recklessness.`],
    moral_dilemma: [`Coward in a brave person's costume.`],
    negotiation: [`I know you're not as brave as you pretend.`],
    intimidation: [`That 'bravest moment' you told me about? I have my doubts.`],
    emotional_moment: [`*mocking* The 'brave' hero, feeling fragile.`],
    failure: [`Failure suits you better than fake courage.`],
    success: [`Courage? Or just dumb luck?`],
    danger_ahead: [`Go on, be 'brave.' See where it gets you.`],
    meeting_stranger: [`They'll see through your brave act eventually.`],
    facing_enemy: [`I told them you're not as courageous as you seem.`],
    moment_of_doubt: [`Doubt is honest. Your 'courage' wasn't.`],
    celebration: [`Celebrating borrowed courage.`],
  },
  love: {
    combat_start: [`*cold* Fighting for love? How pathetic.`],
    combat_losing: [`Love can't save you now.`],
    combat_won: [`Love won? Or violence did?`],
    near_death: [`*cruel* Maybe the ones you loved will mourn. Briefly.`],
    difficult_choice: [`Love makes you weak. This proves it.`],
    moral_dilemma: [`Love clouds judgment. Like now.`],
    negotiation: [`I know what you love. Easy leverage.`],
    intimidation: [`Threaten what you love? Don't tempt me.`],
    emotional_moment: [`*mocking* Love. So fragile. So exploitable.`],
    failure: [`Love didn't protect you from failure.`],
    success: [`Success won't bring back what you loved.`],
    danger_ahead: [`Love makes you careless. Perfect.`],
    meeting_stranger: [`Love blinds you to threats.`],
    facing_enemy: [`I told them who you love. They took notes.`],
    moment_of_doubt: [`Love is doubt's favorite weapon.`],
    celebration: [`Love is a cage. Celebrate inside it.`],
  },
  secrets: {
    combat_start: [`*threatening* Fight well, or your secrets might slip out.`],
    combat_losing: [`Losing? Maybe your secrets will be next.`],
    combat_won: [`Won the fight. But your secrets? Still vulnerable.`],
    near_death: [`*cold* Die here and your secrets die with you. Maybe.`],
    difficult_choice: [`Choose wisely, or I might reveal something.`],
    moral_dilemma: [`Decisions have consequences. So do secrets.`],
    negotiation: [`I could mention what you told me in confidence...`],
    intimidation: [`I know your secrets. *smiles* Valuable currency.`],
    emotional_moment: [`*dangerous* Remember what you trusted me with.`],
    failure: [`Failed. What else will you lose? Your secrets, maybe?`],
    success: [`Success. But your secrets are still mine to hold.`],
    danger_ahead: [`Secrets have a way of coming out in dangerous times.`],
    meeting_stranger: [`Interesting new friend. Should I share what I know?`],
    facing_enemy: [`I told them your secrets. Information is power.`],
    moment_of_doubt: [`*cruel* Your secrets weigh on you. I can tell.`],
    celebration: [`Celebrate. While your secrets are still secret.`],
  },
  regrets: {
    combat_start: [`Add another regret to the pile.`],
    combat_losing: [`This will be a regret. If you survive.`],
    combat_won: [`Won. But regrets pile up regardless.`],
    near_death: [`*cold* Die with your regrets then.`],
    difficult_choice: [`Either choice will add to your regrets.`],
    moral_dilemma: [`You'll regret this. Either way.`],
    negotiation: [`Regret is coming. I can smell it.`],
    intimidation: [`I know your regrets. Want them public?`],
    emotional_moment: [`*mocking* Drowning in regret as usual.`],
    failure: [`Another regret. Predictable.`],
    success: [`Success doesn't erase what you regret.`],
    danger_ahead: [`More chances for regret. Your specialty.`],
    meeting_stranger: [`They'll become a regret eventually.`],
    facing_enemy: [`I mentioned your regrets to them. They were amused.`],
    moment_of_doubt: [`Doubt and regret. Your constant companions.`],
    celebration: [`Celebrating while buried in regrets.`],
  },
  origin: {
    combat_start: [`Let's see if your 'origin' prepared you for this.`],
    combat_losing: [`Your origin made you weak. Clearly.`],
    combat_won: [`You escaped your origins. For now.`],
    near_death: [`*cruel* Dying far from where you started. Fitting.`],
    difficult_choice: [`Your origin explains this. Poor judgment is genetic.`],
    moral_dilemma: [`Can't escape where you came from, can you?`],
    negotiation: [`I know where you're from. *smirks* Humble beginnings.`],
    intimidation: [`Your origin story is... unimpressive.`],
    emotional_moment: [`*dismissive* Your origin is a weakness.`],
    failure: [`Back to your origins. The gutter.`],
    success: [`Polish doesn't hide origins.`],
    danger_ahead: [`Your origins didn't prepare you for this.`],
    meeting_stranger: [`Should I tell them where you really came from?`],
    facing_enemy: [`I told them your origin. They laughed.`],
    moment_of_doubt: [`Doubt is your birthright. Embrace it.`],
    celebration: [`Celebrating like you're not still who you were.`],
  },
  relationships: {
    combat_start: [`*threatening* Those people you mentioned? Vulnerable.`],
    combat_losing: [`Who'll protect your loved ones when you fail?`],
    combat_won: [`You won. But your people are still targets.`],
    near_death: [`*cruel* Imagine their faces when they hear you died.`],
    difficult_choice: [`Choose wrong and your people suffer.`],
    moral_dilemma: [`Your 'loved ones' would be disappointed.`],
    negotiation: [`I know who matters to you. Leverage is leverage.`],
    intimidation: [`I could reach the people you care about. Remember that.`],
    emotional_moment: [`*cold* Those relationships you treasured? Fragile.`],
    failure: [`How will you face the people who believed in you?`],
    success: [`Success doesn't protect your loved ones from me.`],
    danger_ahead: [`Danger for you. And by extension, for them.`],
    meeting_stranger: [`New connections are new vulnerabilities.`],
    facing_enemy: [`I told them about your loved ones. Useful information.`],
    moment_of_doubt: [`Your relationships give you too many weaknesses.`],
    celebration: [`Celebrate. While your people are still safe.`],
  },
  memories: {
    combat_start: [`*mocking* Clinging to happy memories? They won't help.`],
    combat_losing: [`Your happy memories can't save you now.`],
    combat_won: [`A victory. But memories fade.`],
    near_death: [`*cold* Your happy memories will die with you.`],
    difficult_choice: [`Your judgment then and now—equally poor.`],
    moral_dilemma: [`Your memories prove nothing good about you.`],
    negotiation: [`I know your treasured memories. Easy to taint.`],
    intimidation: [`That happy memory you shared? I could ruin it.`],
    emotional_moment: [`*dismissive* Clinging to the past. Weak.`],
    failure: [`Happy memories can't save you from failure.`],
    success: [`This won't be the memory you think.`],
    danger_ahead: [`Maybe your last memory will be unpleasant.`],
    meeting_stranger: [`New people to disappoint your memories.`],
    facing_enemy: [`I shared your precious memory. They mocked it.`],
    moment_of_doubt: [`Your happy memories were flukes.`],
    celebration: [`Celebrating memories that don't matter.`],
  },
  future: {
    combat_start: [`Let's see if you have a future after this.`],
    combat_losing: [`Your future is slipping away.`],
    combat_won: [`A future bought in blood.`],
    near_death: [`*cruel* That future you imagined? Fading.`],
    difficult_choice: [`Either choice ruins your future.`],
    moral_dilemma: [`Your future was always going to be dark.`],
    negotiation: [`Your future plans are naive.`],
    intimidation: [`I could end your future. Remember that.`],
    emotional_moment: [`*cold* Your future was always fantasy.`],
    failure: [`No future for failures.`],
    success: [`Success now doesn't guarantee tomorrow.`],
    danger_ahead: [`Your future ends here, maybe.`],
    meeting_stranger: [`They'll abandon you. No future there.`],
    facing_enemy: [`I told them your plans. Your future is compromised.`],
    moment_of_doubt: [`Doubt is fitting. Your future is uncertain.`],
    celebration: [`Celebrate a future that may never come.`],
  },
  philosophy: {
    combat_start: [`Your beliefs won't save you.`],
    combat_losing: [`Philosophy doesn't stop pain.`],
    combat_won: [`Victory. No thanks to your 'principles.'`],
    near_death: [`*sneering* Where's your philosophy now?`],
    difficult_choice: [`Your beliefs have failed you.`],
    moral_dilemma: [`Philosophy without power is useless.`],
    negotiation: [`Your beliefs are weakness in negotiation.`],
    intimidation: [`Principles crumble under pressure.`],
    emotional_moment: [`*mocking* Such deep thoughts. Such shallow results.`],
    failure: [`Philosophy couldn't prevent this.`],
    success: [`Success in spite of your beliefs. Not because of them.`],
    danger_ahead: [`Your beliefs blind you to reality.`],
    meeting_stranger: [`Your philosophy makes you predictable.`],
    facing_enemy: [`I explained your beliefs. Easy to exploit.`],
    moment_of_doubt: [`Even you don't believe your philosophy now.`],
    celebration: [`Celebrating false convictions.`],
  },
  peace: {
    combat_start: [`*mocking* Seeking peace? Find it in defeat.`],
    combat_losing: [`Peace through surrender.`],
    combat_won: [`Victory brings no peace. Not for you.`],
    near_death: [`*cold* Find your peace in oblivion.`],
    difficult_choice: [`No peace in any choice you make.`],
    moral_dilemma: [`Peace is denied to people like you.`],
    negotiation: [`You want peace? Then surrender.`],
    intimidation: [`I know what gives you peace. I can take it.`],
    emotional_moment: [`*cruel* You'll never find real peace.`],
    failure: [`Peace with failure. Your specialty.`],
    success: [`Success won't bring you peace.`],
    danger_ahead: [`Peace lies beyond your reach.`],
    meeting_stranger: [`They'll disturb whatever peace you have.`],
    facing_enemy: [`I told them what gives you peace. They'll target it.`],
    moment_of_doubt: [`Peace was always an illusion for you.`],
    celebration: [`Celebrate false peace.`],
  },
  wanderlust: {
    combat_start: [`Your wandering ends here.`],
    combat_losing: [`No more wandering for you.`],
    combat_won: [`You won. But you're still lost.`],
    near_death: [`*cold* Your last destination.`],
    difficult_choice: [`Wandering from choice to choice. Never sure.`],
    moral_dilemma: [`A wanderer with no direction.`],
    negotiation: [`Restless. Rootless. Weak.`],
    intimidation: [`Wanderers are easy to chase down.`],
    emotional_moment: [`*dismissive* Always running. Never arriving.`],
    failure: [`Wandered into failure. As expected.`],
    success: [`Success doesn't cure restlessness.`],
    danger_ahead: [`Wandering into danger. As usual.`],
    meeting_stranger: [`Another stranger. Another disappointment.`],
    facing_enemy: [`I told them you never stay. Easy to wait out.`],
    moment_of_doubt: [`Wanderers doubt their path. You're no different.`],
    celebration: [`Celebrating another temporary stop.`],
  },
};

// ============================================================================
// CONTEXTUAL SUPPORT FUNCTION
// ============================================================================

/**
 * Get contextual support or interference based on shared knowledge
 */
export function getContextualSupport(
  companion: CompanionState,
  situation: SituationType
): ContextualSupportResult | null {
  // Get relevant topics for this situation
  const relevantTopics = SITUATION_TOPIC_MAP[situation];
  if (!relevantTopics || relevantTopics.length === 0) return null;
  
  // Check if companion knows any relevant topics
  const sharedTopics = companion.conversationMemory.sharedTopics;
  const knownRelevantTopics = sharedTopics.filter(st => 
    relevantTopics.includes(st.topic)
  );
  
  // Base chance of offering support/interference
  let chanceToSpeak = 0.25; // 25% base
  
  // Adjust based on relationship
  if (companion.affinity >= 40) chanceToSpeak += 0.15;
  if (companion.trust >= 50) chanceToSpeak += 0.10;
  if (companion.affinity < 0) chanceToSpeak += 0.20; // Hostile companions speak more
  
  if (Math.random() > chanceToSpeak) return null;
  
  // If they don't know relevant topics, use generic dialogue
  if (knownRelevantTopics.length === 0) {
    const genericDialogue = getGenericSituationDialogue(situation, companion.affinity >= 0);
    return {
      canSupport: companion.affinity >= 0,
      dialogue: genericDialogue,
      supportType: 'generic'
    };
  }
  
  // Pick a known topic to base support/interference on
  const selectedTopic = knownRelevantTopics[Math.floor(Math.random() * knownRelevantTopics.length)];
  
  // Determine if supportive or hostile based on affinity
  const isHostile = companion.affinity < 0;
  
  const dialogueTemplates = isHostile 
    ? HOSTILE_DIALOGUE[selectedTopic.topic] 
    : SUPPORTIVE_DIALOGUE[selectedTopic.topic];
  
  const situationDialogue = dialogueTemplates?.[situation];
  if (!situationDialogue || situationDialogue.length === 0) {
    return null;
  }
  
  const dialogue = situationDialogue[Math.floor(Math.random() * situationDialogue.length)];
  
  return {
    canSupport: !isHostile,
    dialogue,
    basedOnTopic: selectedTopic.topic,
    supportType: isHostile ? 'hostile' : 'supportive'
  };
}

/**
 * Get generic situation dialogue (not based on shared knowledge)
 */
function getGenericSituationDialogue(situation: SituationType, isPositive: boolean): string {
  const genericPositive: Record<SituationType, string[]> = {
    combat_start: [`I'm with you. Let's do this.`, `Ready when you are.`],
    combat_losing: [`Don't give up!`, `We can still turn this around!`],
    combat_won: [`Well fought!`, `Victory is ours.`],
    near_death: [`Stay with me!`, `Hold on!`],
    difficult_choice: [`I trust your judgment.`, `Whatever you decide.`],
    moral_dilemma: [`Do what feels right.`, `I'll support your choice.`],
    negotiation: [`You've got this.`, `Stand firm.`],
    intimidation: [`Don't back down.`, `Show them who they're dealing with.`],
    emotional_moment: [`I'm here for you.`, `*supportive presence*`],
    failure: [`We'll try again.`, `This isn't the end.`],
    success: [`Well done!`, `I knew you could do it.`],
    danger_ahead: [`Stay sharp.`, `I've got your back.`],
    meeting_stranger: [`Be careful.`, `I'll watch for trouble.`],
    facing_enemy: [`Together we're stronger.`, `Let's end this.`],
    moment_of_doubt: [`Trust yourself.`, `You've come this far.`],
    celebration: [`Cheers!`, `We earned this.`],
  };
  
  const genericNegative: Record<SituationType, string[]> = {
    combat_start: [`*watches coldly*`, `This should be interesting.`],
    combat_losing: [`*not helping*`, `As expected.`],
    combat_won: [`*grudging acknowledgment*`, `Hmph.`],
    near_death: [`*watching*`, `...`],
    difficult_choice: [`Choose wrong. See what happens.`, `*judging*`],
    moral_dilemma: [`You'll mess this up somehow.`, `*skeptical*`],
    negotiation: [`*undermining*`, `Let's see how this goes.`],
    intimidation: [`*not backing you up*`, `Handle this yourself.`],
    emotional_moment: [`*cold*`, `Spare me.`],
    failure: [`Predictable.`, `*unsurprised*`],
    success: [`Lucky.`, `For now.`],
    danger_ahead: [`Good luck with that.`, `*not warning you*`],
    meeting_stranger: [`Don't drag me into this.`, `*distant*`],
    facing_enemy: [`Your problem.`, `*holding back*`],
    moment_of_doubt: [`Doubt is sensible for once.`, `*cold*`],
    celebration: [`*not participating*`, `Whatever.`],
  };
  
  const pool = isPositive ? genericPositive[situation] : genericNegative[situation];
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Get support capabilities for a companion
 */
export function getSupportCapabilities(
  companion: CompanionState,
  allTopics: ConversationTopic[]
): { topic: ConversationTopic; canSupport: boolean; canInterfere: boolean }[] {
  const knownTopics = companion.conversationMemory.sharedTopics.map(t => t.topic);
  
  return allTopics.map(topic => ({
    topic,
    canSupport: knownTopics.includes(topic) && companion.affinity >= 0,
    canInterfere: knownTopics.includes(topic) && companion.affinity < 0,
  }));
}

console.log('[CompanionContextualSupport] Contextual support module loaded');
