// ============================================================================
// PERSONALITY-BASED DIALOGUE VARIATIONS
// Rich, trait-specific dialogue for companion reactions
// ============================================================================

import { CompanionState, PlayerActionType, PersonalityTrait } from './companionTypes';

// ============================================================================
// TRAIT-SPECIFIC APPROVAL DIALOGUE
// ============================================================================

const TRAIT_APPROVAL_DIALOGUE: Record<PersonalityTrait, Record<PlayerActionType, string[]>> = {
  honorable: {
    combat_spare: [
      `*nods with approval* "Mercy in victory. That is the mark of true strength."`,
      `"You show the honor I'd expect. Not all would spare a beaten foe."`,
      `*sheathes weapon slowly* "This is what separates us from beasts."`,
      `"Well done. A warrior's worth isn't measured in bodies."`,
    ],
    truth: [
      `"The truth, even when it costs us. I respect that greatly."`,
      `*slight smile* "Honesty is a blade that cuts both ways, yet you wield it well."`,
      `"In a world of liars, you stand apart. I am proud to know you."`,
    ],
    loyalty: [
      `"This is why I follow you. Loyalty repaid with loyalty."`,
      `*moved expression* "You stood firm when others would have fled. I'll remember this."`,
      `"In the old days, such loyalty was sung of in halls. You carry that spirit."`,
    ],
    bravery: [
      `*grips shoulder firmly* "Courage in the face of terror. You have my respect."`,
      `"That... that was brave. Perhaps foolish, but brave nonetheless."`,
      `"Few would have stood their ground. You did. That matters."`,
    ],
    sacrifice: [
      `*eyes glisten* "You gave of yourself for others. That is the highest honor."`,
      `"To sacrifice... it is no small thing. You have earned more than my respect."`,
      `"I have seen warriors fall for less noble causes. Your sacrifice... it moves me."`,
    ],
    combat_kill: [],
    theft: [],
    charity: [`"Generosity befitting someone of honor. Well done."`],
    lie: [],
    violence: [],
    diplomacy: [`"Words over swords. A wise choice when possible."`],
    betrayal: [],
    cowardice: [],
    romance_flirt: [],
    romance_reject: [],
    insult: [],
    compliment: [`"Kind words cost nothing but mean everything. You understand this."`],
    greed: [],
    mercy: [`"Mercy is strength, not weakness. You understand what many do not."`],
    cruelty: [],
  },
  
  ruthless: {
    combat_kill: [
      `*cold smile* "Dead enemies cause no problems. Smart."`,
      `"Efficient. Why leave loose ends?"`,
      `"Good. Mercy is for those who can afford it."`,
      `*nods approvingly* "You understand how the world really works."`,
    ],
    violence: [
      `"Sometimes violence is the only language they understand."`,
      `*dark chuckle* "That's more like it. Action speaks louder than words."`,
      `"Fear is a tool. You're learning to use it."`,
    ],
    theft: [
      `"Take what you need. The strong always have."`,
      `*shrugs* "They weren't using it properly anyway."`,
      `"Property is just... a suggestion, really."`,
    ],
    greed: [
      `"Look out for yourself first. Everyone else does."`,
      `"Money is power. Never apologize for wanting more."`,
    ],
    lie: [
      `"Truth is for those who lack imagination."`,
      `*smirks* "A well-crafted lie is an art form."`,
    ],
    cruelty: [
      `"Sometimes you have to make an example."`,
      `"Pain is an effective teacher."`,
    ],
    combat_spare: [],
    charity: [],
    truth: [],
    diplomacy: [],
    betrayal: [],
    loyalty: [`"Loyalty to the right people. You chose well."`],
    cowardice: [],
    bravery: [`"Bold. Reckless even. But I respect the audacity."`],
    romance_flirt: [],
    romance_reject: [],
    insult: [`"Ha! They had it coming."`],
    compliment: [],
    sacrifice: [],
    mercy: [],
  },
  
  kind: {
    charity: [
      `*warm smile* "Your kindness makes the world a little brighter."`,
      `"Not everyone would stop to help. You did. That matters."`,
      `*touched* "Generosity from the heart. You inspire me."`,
      `"Small acts of kindness... they ripple outward. Thank you."`,
    ],
    mercy: [
      `"Mercy takes more strength than cruelty ever could."`,
      `*relieved* "Thank you. I couldn't bear to watch more suffering."`,
      `"You chose compassion. I knew you would."`,
    ],
    combat_spare: [
      `"There's enough death in this world. Thank you for not adding to it."`,
      `*smiles gently* "Forgiveness is never weakness."`,
    ],
    diplomacy: [
      `"Words can heal what violence only wounds."`,
      `*nods* "Understanding over bloodshed. Always the better path."`,
    ],
    compliment: [
      `"Kindness costs nothing but means everything."`,
      `*happy expression* "You made someone's day brighter."`,
    ],
    truth: [
      `"Gentle truth is still truth. Well handled."`,
    ],
    sacrifice: [
      `*tears up* "You put others before yourself. That's... that's beautiful."`,
      `"Self-sacrifice... you have a good heart."`,
    ],
    loyalty: [
      `"Standing by those who need you. That's what matters."`,
    ],
    combat_kill: [],
    theft: [],
    lie: [],
    violence: [],
    betrayal: [],
    cowardice: [],
    bravery: [`"Brave and kind. A rare combination."`],
    romance_flirt: [`*blushes* "That was sweet of you."`],
    romance_reject: [],
    insult: [],
    greed: [],
    cruelty: [],
  },
  
  cruel: {
    cruelty: [
      `*dark grin* "Now THAT was entertaining."`,
      `"Suffering is just... information. You're gathering data."`,
      `*laughs coldly* "They'll think twice now, won't they?"`,
    ],
    combat_kill: [
      `"Death is too quick for some, but it'll do."`,
      `*satisfied* "One less problem breathing."`,
    ],
    violence: [
      `"Violence is honest. I respect that."`,
      `*watches intently* "Beautiful, in its own way."`,
    ],
    insult: [
      `"Words can wound deeper than blades. You know this."`,
      `*cruel smile* "Their face... priceless."`,
    ],
    lie: [
      `"Twist the knife with words. I appreciate the technique."`,
    ],
    combat_spare: [],
    theft: [`"Taking what's theirs. Their loss, our gain."`],
    charity: [],
    truth: [],
    diplomacy: [],
    betrayal: [`"Betrayal has a certain... poetry to it."`],
    loyalty: [],
    cowardice: [],
    bravery: [],
    romance_flirt: [],
    romance_reject: [`*cold laugh* "Breaking hearts now? Good."`],
    compliment: [],
    greed: [`"Greed is just... ambition without pretense."`],
    sacrifice: [],
    mercy: [],
  },
  
  brave: {
    bravery: [
      `*impressed* "That took guts. Real guts."`,
      `"Charging into danger... now THAT'S what I'm talking about!"`,
      `*grins widely* "Fear? What fear! You showed them!"`,
      `"Standing tall when everything screams to run. You have a warrior's heart."`,
    ],
    combat_kill: [
      `"You faced them head-on. No tricks, no running. Respect."`,
      `*pumps fist* "That's how it's done!"`,
    ],
    sacrifice: [
      `"Risking yourself for others... that's the bravest thing of all."`,
      `*awed* "I've seen courage before. This... this was something more."`,
    ],
    loyalty: [
      `"Standing by your allies in the thick of it. True courage."`,
    ],
    violence: [
      `"Sometimes you have to fight. You didn't hesitate."`,
    ],
    truth: [
      `"Speaking truth to power. That takes its own kind of bravery."`,
    ],
    combat_spare: [],
    theft: [],
    charity: [],
    lie: [],
    diplomacy: [],
    betrayal: [],
    cowardice: [],
    romance_flirt: [`*grins* "Bold move! I like it."`],
    romance_reject: [],
    insult: [],
    compliment: [],
    greed: [],
    mercy: [],
    cruelty: [],
  },
  
  cowardly: {
    diplomacy: [
      `*relieved* "Good, good. No fighting. I like this approach."`,
      `"Words work! See? No need for all that... violence."`,
      `*exhales* "Smart. Very smart. Why risk getting hurt?"`,
    ],
    lie: [
      `"A clever deception beats a dangerous truth."`,
      `"If it keeps us safe, who cares about honesty?"`,
    ],
    theft: [
      `"Taking without confrontation. Efficient. Safe."`,
    ],
    combat_spare: [
      `"Let them go. They might have friends. Big friends."`,
      `*nervous* "Killing just makes more enemies..."`,
    ],
    bravery: [],
    combat_kill: [],
    charity: [],
    truth: [],
    violence: [],
    betrayal: [],
    loyalty: [],
    cowardice: [`*fidgeting* "I mean... discretion is the better part of valor, right?"`],
    romance_flirt: [],
    romance_reject: [],
    insult: [],
    compliment: [],
    greed: [],
    sacrifice: [],
    mercy: [`"Mercy means fewer enemies. I approve."`],
    cruelty: [],
  },
  
  greedy: {
    greed: [
      `*eyes gleaming* "Now you're thinking! Always take what you can."`,
      `"Profit is profit. Never apologize for success."`,
      `*rubbing hands* "More for us, less for them. Perfect."`,
    ],
    theft: [
      `"They weren't watching it closely enough. Their fault."`,
      `*impressed* "Quick hands! I knew I liked you."`,
      `"Finders keepers, right?"`,
    ],
    combat_kill: [
      `"Check their pockets. Dead don't need gold."`,
    ],
    lie: [
      `"Truth is expensive. Lies are free. Simple economics."`,
    ],
    diplomacy: [
      `"If it gets us a better deal, talk all you want."`,
    ],
    combat_spare: [],
    charity: [],
    truth: [],
    violence: [],
    betrayal: [],
    loyalty: [`"Loyalty has its rewards. Good investment."`],
    cowardice: [],
    bravery: [],
    romance_flirt: [],
    romance_reject: [],
    insult: [],
    compliment: [],
    sacrifice: [],
    mercy: [],
    cruelty: [],
  },
  
  generous: {
    charity: [
      `*beaming* "This! This is what it's all about!"`,
      `"Giving feels better than taking, doesn't it?"`,
      `*moved* "You understand that wealth means nothing if not shared."`,
      `"The world needs more people like you."`,
    ],
    sacrifice: [
      `"Giving of yourself... the greatest gift there is."`,
      `*emotional* "You put others first. Always. It's beautiful."`,
    ],
    mercy: [
      `"Grace and generosity in victory. Wonderful."`,
    ],
    combat_spare: [
      `"Life is precious. You understand its value."`,
    ],
    diplomacy: [
      `"Generosity of spirit extends to words too. Well done."`,
    ],
    compliment: [
      `"Generous with kindness. The best currency."`,
    ],
    combat_kill: [],
    theft: [],
    lie: [],
    truth: [`"The truth, freely given. A rare gift."`],
    violence: [],
    betrayal: [],
    loyalty: [`"Your loyalty is a gift to those who receive it."`],
    cowardice: [],
    bravery: [],
    romance_flirt: [],
    romance_reject: [],
    insult: [],
    greed: [],
    cruelty: [],
  },
  
  loyal: {
    loyalty: [
      `*fierce pride* "THIS is loyalty. Never doubted you for a moment."`,
      `"Standing true when it costs you... that's the real test. You passed."`,
      `*grips arm firmly* "Through fire and shadow, I'll follow you."`,
      `"Loyalty answered with loyalty. As it should be."`,
    ],
    sacrifice: [
      `"You'd give everything for your people. I'd do the same for you."`,
      `*voice thick* "That kind of sacrifice... it binds us forever."`,
    ],
    bravery: [
      `"Standing your ground for those who matter. True loyalty."`,
    ],
    truth: [
      `"Honest even when it hurts. I value that."`,
    ],
    combat_spare: [
      `"Mercy for the defeated shows you haven't lost yourself."`,
    ],
    combat_kill: [],
    theft: [],
    charity: [`"Looking after your own. That's what matters."`],
    lie: [],
    violence: [],
    diplomacy: [],
    betrayal: [],
    cowardice: [],
    romance_flirt: [],
    romance_reject: [],
    insult: [],
    compliment: [],
    greed: [],
    mercy: [],
    cruelty: [],
  },
  
  treacherous: {
    betrayal: [
      `*dark smile* "Everyone betrays someone eventually. You just did it first."`,
      `"Trust is for the naive. You understand reality."`,
      `*approving nod* "Strike before they strike you. Smart."`,
    ],
    lie: [
      `"The truth is just... one version of events."`,
      `*impressed* "A beautiful deception. I'm taking notes."`,
      `"Words are weapons. You wield them well."`,
    ],
    theft: [
      `"What's theirs is negotiable."`,
    ],
    greed: [
      `"Looking out for yourself. The only person you can trust."`,
    ],
    combat_spare: [],
    combat_kill: [`"Dead men tell no tales. Smart."`],
    charity: [],
    truth: [],
    violence: [],
    diplomacy: [`"Keep them guessing. I like it."`],
    loyalty: [],
    cowardice: [],
    bravery: [],
    romance_flirt: [`"Charm is just another weapon."`],
    romance_reject: [],
    insult: [],
    compliment: [],
    sacrifice: [],
    mercy: [],
    cruelty: [],
  },
  
  romantic: {
    romance_flirt: [
      `*blushes deeply* "That was... oh my. I wasn't expecting that."`,
      `*fans self* "You certainly know how to make someone feel special."`,
      `*shy smile* "Is it warm in here, or is that just me?"`,
      `*giggles* "Oh, stop... no, actually, don't stop."`,
    ],
    compliment: [
      `*touched* "That's... that's so sweet of you."`,
      `"You always know just what to say."`,
      `*dreamy sigh* "Words like poetry..."`,
    ],
    sacrifice: [
      `*moved* "You'd sacrifice for love... for us? My heart..."`,
      `"That's the most romantic thing anyone's ever done."`,
    ],
    loyalty: [
      `"Faithful and true... like something from a story."`,
    ],
    mercy: [
      `"A gentle heart. I find that... attractive."`,
    ],
    combat_spare: [],
    combat_kill: [],
    theft: [],
    charity: [`"Such a giving heart. *sighs* How can I resist?"`],
    lie: [],
    truth: [`"Honesty in matters of the heart. So refreshing."`],
    violence: [],
    diplomacy: [],
    betrayal: [],
    cowardice: [],
    bravery: [`"So brave... *fans self* Be still, my heart."`],
    romance_reject: [],
    insult: [],
    greed: [],
    cruelty: [],
  },
  
  pragmatic: {
    diplomacy: [
      `*nods* "Efficient. No wasted blood, no wasted time."`,
      `"Talking our way out. Cost-effective solution."`,
      `"The practical choice. I approve."`,
    ],
    truth: [
      `"Clear communication. Reduces misunderstandings."`,
    ],
    lie: [
      `"Sometimes a lie serves the greater purpose. Acceptable."`,
    ],
    theft: [
      `"Resources acquired by alternative means. Practical."`,
    ],
    greed: [
      `"Accumulating resources for future needs. Sensible."`,
    ],
    combat_kill: [
      `"Threat eliminated. One less variable."`,
    ],
    combat_spare: [
      `"Potential future asset. Smart thinking."`,
    ],
    mercy: [
      `"Mercy creates goodwill. Useful for later."`,
    ],
    charity: [],
    violence: [],
    betrayal: [],
    loyalty: [`"Maintaining alliances. Good strategy."`],
    cowardice: [],
    bravery: [],
    romance_flirt: [],
    romance_reject: [],
    insult: [],
    compliment: [],
    sacrifice: [],
    cruelty: [],
  },
  
  spiritual: {
    mercy: [
      `*serene* "The spirits smile upon mercy. You feel it too, don't you?"`,
      `"Compassion is the truest form of worship."`,
      `"The divine lives in acts of grace like this."`,
    ],
    sacrifice: [
      `"Self-sacrifice... the highest path. The ancestors are watching."`,
      `*reverent* "You walk the way of the sacred."`,
    ],
    truth: [
      `"Truth is sacred. You honor the old ways."`,
      `"Honesty pleases the spirits."`,
    ],
    charity: [
      `"Give freely, receive freely. The cosmic balance."`,
    ],
    combat_spare: [
      `"Life is sacred. You understand this deeply."`,
    ],
    combat_kill: [],
    theft: [],
    lie: [],
    violence: [],
    diplomacy: [`"Peace is the way. The spirits guide your words."`],
    betrayal: [],
    loyalty: [`"Sacred bonds, honored. The ancestors are pleased."`],
    cowardice: [],
    bravery: [`"Courage blessed by the divine."`],
    romance_flirt: [],
    romance_reject: [],
    insult: [],
    compliment: [],
    greed: [],
    cruelty: [],
  },
  
  skeptical: {
    truth: [
      `*raised eyebrow* "Interesting. The truth, for once. Noted."`,
      `"You actually said what you meant. That's... rare."`,
      `"Honesty. I'll have to recalibrate my expectations."`,
    ],
    diplomacy: [
      `"At least you tried talking first. That's something."`,
    ],
    lie: [
      `*slight nod* "A necessary deception? Possibly. I'll reserve judgment."`,
    ],
    combat_spare: [],
    combat_kill: [],
    theft: [],
    charity: [`*tilts head* "Generous. I wonder what you want in return."`],
    violence: [],
    betrayal: [],
    loyalty: [`"Loyalty... I'll believe it when I see more evidence."`],
    cowardice: [],
    bravery: [`"Brave or foolish? Time will tell."`],
    romance_flirt: [`*narrows eyes* "Flattery? What's your angle?"`],
    romance_reject: [],
    insult: [],
    compliment: [`"A compliment. Genuine? We'll see."`],
    greed: [],
    sacrifice: [`"Self-sacrifice? Hmm. Either noble or stupid."`],
    mercy: [`"Mercy now... but for what later gain?"`],
    cruelty: [],
  },
  
  vengeful: {
    betrayal: [
      `*dark satisfaction* "An eye for an eye. They had it coming."`,
      `"Revenge served. As it should be."`,
      `*cold smile* "Balance is restored."`,
    ],
    combat_kill: [
      `"Justice delivered. They won't hurt anyone else."`,
      `*grim nod* "Some debts can only be paid in blood."`,
    ],
    violence: [
      `"Sometimes violence IS the answer."`,
      `"They provoked this. They pay the price."`,
    ],
    cruelty: [
      `"Let them suffer. They earned it."`,
    ],
    insult: [
      `"Words can wound for a lifetime. Good."`,
    ],
    combat_spare: [],
    theft: [],
    charity: [],
    lie: [`"If lies serve vengeance, so be it."`],
    truth: [],
    diplomacy: [],
    loyalty: [],
    cowardice: [],
    bravery: [`"Facing your enemies head-on. Satisfying."`],
    romance_flirt: [],
    romance_reject: [],
    compliment: [],
    greed: [],
    sacrifice: [],
    mercy: [],
  },
  
  forgiving: {
    mercy: [
      `*relieved sigh* "Thank you. Holding grudges poisons the soul."`,
      `"Forgiveness heals both the giver and receiver."`,
      `*peaceful smile* "This is the way forward."`,
      `"Mercy breaks the cycle of pain. Wise choice."`,
    ],
    combat_spare: [
      `"Letting them live... that takes real strength."`,
      `"There's been enough suffering. I'm glad you stopped."`,
    ],
    diplomacy: [
      `"Words of peace. The harder path, but the right one."`,
    ],
    charity: [
      `"Kindness given freely. How refreshing."`,
    ],
    truth: [
      `"Honest reconciliation. The best foundation."`,
    ],
    compliment: [
      `"Building bridges instead of walls. Beautiful."`,
    ],
    combat_kill: [],
    theft: [],
    lie: [],
    violence: [],
    betrayal: [],
    loyalty: [`"True loyalty includes forgiveness."`],
    cowardice: [],
    bravery: [],
    romance_flirt: [],
    romance_reject: [],
    insult: [],
    greed: [],
    sacrifice: [],
    cruelty: [],
  },
  
  ambitious: {
    greed: [
      `*approving* "Always reaching for more. I respect the drive."`,
      `"Ambition requires resources. Take what you need."`,
    ],
    diplomacy: [
      `"Making allies, gaining influence. Smart politics."`,
    ],
    bravery: [
      `"Bold moves for bold gains. I like it."`,
    ],
    combat_kill: [
      `"Removing obstacles from your path. Efficient."`,
    ],
    betrayal: [
      `"Sometimes you have to step over others to rise."`,
    ],
    lie: [
      `"Tell them what they want to hear. Classic strategy."`,
    ],
    loyalty: [
      `"Building a power base. Everyone needs allies."`,
    ],
    combat_spare: [],
    theft: [`"Acquiring assets by any means. Ambitious."`],
    charity: [],
    truth: [],
    violence: [],
    cowardice: [],
    romance_flirt: [],
    romance_reject: [],
    insult: [],
    compliment: [],
    sacrifice: [],
    mercy: [],
    cruelty: [],
  },
  
  humble: {
    charity: [
      `*simple smile* "Sharing what we have. That's what matters."`,
      `"We don't need much. Others need more."`,
    ],
    mercy: [
      `"Who are we to judge? Mercy is always appropriate."`,
    ],
    truth: [
      `"Plain honesty. No need for pretense."`,
    ],
    sacrifice: [
      `"Giving without expecting return. That's the way."`,
    ],
    diplomacy: [
      `"Quiet words accomplish much."`,
    ],
    combat_spare: [
      `"We're all just... people. No need for more death."`,
    ],
    compliment: [
      `"Kind words cost nothing."`,
    ],
    combat_kill: [],
    theft: [],
    lie: [],
    violence: [],
    betrayal: [],
    loyalty: [`"Standing by friends. Simple as that."`],
    cowardice: [],
    bravery: [`"Just doing what needed doing. Nothing special."`],
    romance_flirt: [],
    romance_reject: [],
    insult: [],
    greed: [],
    cruelty: [],
  },
};

// ============================================================================
// TRAIT-SPECIFIC DISAPPROVAL DIALOGUE
// ============================================================================

const TRAIT_DISAPPROVAL_DIALOGUE: Partial<Record<PersonalityTrait, Record<PlayerActionType, string[]>>> = {
  honorable: {
    betrayal: [
      `*disgusted* "This... this is beneath you. Beneath us."`,
      `"I cannot stand by and watch such dishonor."`,
      `*steps back* "You've broken something sacred today."`,
      `"My ancestors would spit on such treachery."`,
    ],
    lie: [
      `*frowns deeply* "The truth costs you nothing. Why choose deception?"`,
      `"Lies tangle like thorns. You'll regret this path."`,
    ],
    cowardice: [
      `*disappointed* "We could have stood our ground. Should have."`,
      `"Running... I expected better."`,
    ],
    cruelty: [
      `*turns away* "There is no honor in cruelty. Only shame."`,
      `"This... this is not the way of a warrior."`,
    ],
    theft: [
      `"Taking what isn't earned? Where is the honor in that?"`,
    ],
    combat_kill: [],
    combat_spare: [],
    charity: [],
    truth: [],
    violence: [],
    diplomacy: [],
    loyalty: [],
    bravery: [],
    romance_flirt: [],
    romance_reject: [],
    insult: [],
    compliment: [],
    greed: [`"Greed is the enemy of honor."`],
    sacrifice: [],
    mercy: [],
  },
  
  kind: {
    cruelty: [
      `*tears forming* "How could you? They were helpless..."`,
      `*looks away* "I can't watch this. I won't."`,
      `"There's enough pain in the world without adding to it."`,
      `*shaking* "This isn't you. Please... tell me this isn't you."`,
    ],
    violence: [
      `*flinches* "Was that really necessary?"`,
      `"There must have been another way..."`,
    ],
    combat_kill: [
      `"They didn't have to die... did they?"`,
      `*quiet* "Another life ended. For what?"`,
    ],
    insult: [
      `"Words wound deeper than you know."`,
      `*pained expression* "That was cruel."`,
    ],
    betrayal: [
      `*hurt* "How could you? They trusted you..."`,
    ],
    combat_spare: [],
    theft: [`"Taking from others... is that who we are now?"`],
    charity: [],
    lie: [`*sad* "Lies always hurt someone eventually."`],
    truth: [],
    diplomacy: [],
    loyalty: [],
    cowardice: [],
    bravery: [],
    romance_flirt: [],
    romance_reject: [],
    compliment: [],
    greed: [`"Greed closes the heart to others' needs."`],
    sacrifice: [],
    mercy: [],
  },
  
  brave: {
    cowardice: [
      `*scoffs* "We RAN? From THAT?"`,
      `"I didn't think you had it in you to flee. I was wrong."`,
      `*frustrated* "Stand and fight! That's what warriors DO!"`,
      `*kicks dirt* "I've never been so embarrassed."`,
    ],
    lie: [
      `"Lies are the weapons of cowards."`,
    ],
    diplomacy: [
      `*impatient* "Talk, talk, talk. Sometimes you just have to ACT."`,
    ],
    theft: [
      `"Taking from the shadows? Where's the courage in that?"`,
    ],
    combat_spare: [],
    combat_kill: [],
    charity: [],
    truth: [],
    violence: [],
    betrayal: [`"Stabbing someone in the back? That's not bravery."`],
    loyalty: [],
    bravery: [],
    romance_flirt: [],
    romance_reject: [],
    insult: [],
    compliment: [],
    greed: [],
    sacrifice: [],
    mercy: [],
    cruelty: [],
  },
  
  loyal: {
    betrayal: [
      `*stricken* "How COULD you? After everything..."`,
      `"Betrayal... I never thought... not from YOU."`,
      `*voice breaking* "Trust is sacred. You've shattered something today."`,
      `"I defended you. I VOUCHED for you. And this is..."`,
    ],
    lie: [
      `"Even to me? You'd lie to ME?"`,
      `*hurt* "I thought we were honest with each other."`,
    ],
    cowardice: [
      `"You abandoned them. You just... left."`,
      `"Loyalty means staying when it's hard."`,
    ],
    greed: [
      `"Choosing gold over people? Where's the loyalty in that?"`,
    ],
    combat_spare: [],
    combat_kill: [],
    theft: [],
    charity: [],
    truth: [],
    violence: [],
    diplomacy: [],
    loyalty: [],
    bravery: [],
    romance_flirt: [],
    romance_reject: [],
    insult: [],
    compliment: [],
    sacrifice: [],
    mercy: [],
    cruelty: [],
  },
  
  romantic: {
    romance_reject: [
      `*devastated* "I... I poured my heart out, and you just..."`,
      `*trying not to cry* "I thought... I thought we had something special."`,
      `"Oh. I see. I was foolish to hope."`,
      `*turns away* "Some dreams aren't meant to be, I suppose."`,
    ],
    cruelty: [
      `"How can you be so... cold? Where's your heart?"`,
      `*shudders* "This isn't romantic at all. This is just... ugly."`,
    ],
    betrayal: [
      `"Love built on lies... it means nothing."`,
    ],
    insult: [
      `"Harsh words have no place between people who care."`,
    ],
    combat_spare: [],
    combat_kill: [`"Death has no poetry. Only endings."`],
    theft: [],
    charity: [],
    lie: [],
    truth: [],
    violence: [`"Violence is the enemy of love."`],
    diplomacy: [],
    loyalty: [],
    cowardice: [],
    bravery: [],
    romance_flirt: [],
    compliment: [],
    greed: [],
    sacrifice: [],
    mercy: [],
  },
};

// ============================================================================
// NEUTRAL/MIXED TRAIT DIALOGUE
// ============================================================================

const NEUTRAL_DIALOGUE_TEMPLATES = [
  `*observes silently* "Hmm."`,
  `"An interesting choice."`,
  `*considers* "I see what you're doing."`,
  `"Not what I expected, but... it's your call."`,
  `*shrugs slightly* "Could have gone either way."`,
  `"...Noted."`,
  `*watches carefully*`,
  `"Time will tell if that was wise."`,
  `"Neither here nor there, I suppose."`,
  `*noncommittal grunt*`,
];

// ============================================================================
// DIALOGUE GENERATION FUNCTIONS
// ============================================================================

export function generateTraitBasedApproval(
  companion: CompanionState,
  actionType: PlayerActionType
): string {
  const traits = companion.personality.traits;
  
  // Try each trait in order to find relevant dialogue
  for (const trait of traits) {
    const traitDialogues = TRAIT_APPROVAL_DIALOGUE[trait]?.[actionType];
    if (traitDialogues && traitDialogues.length > 0) {
      return traitDialogues[Math.floor(Math.random() * traitDialogues.length)];
    }
  }
  
  // Fallback to catchphrase or generic approval
  if (companion.personality.catchphrases.length > 0 && Math.random() < 0.4) {
    return companion.personality.catchphrases[
      Math.floor(Math.random() * companion.personality.catchphrases.length)
    ];
  }
  
  const genericApprovals = [
    `"Now that's what I like to see!"`,
    `"I knew I was right about you."`,
    `"This is why I follow you."`,
    `*nods approvingly* "Well done."`,
    `"Finally, someone who understands."`,
  ];
  
  return genericApprovals[Math.floor(Math.random() * genericApprovals.length)];
}

export function generateTraitBasedDisapproval(
  companion: CompanionState,
  actionType: PlayerActionType
): string {
  const traits = companion.personality.traits;
  const intensity = Math.abs(companion.affinity);
  
  // Try each trait in order to find relevant dialogue
  for (const trait of traits) {
    const traitDialogues = TRAIT_DISAPPROVAL_DIALOGUE[trait]?.[actionType];
    if (traitDialogues && traitDialogues.length > 0) {
      return traitDialogues[Math.floor(Math.random() * traitDialogues.length)];
    }
  }
  
  // Intensity-based fallback
  if (intensity > 60) {
    const severeDialogues = [
      `"This is exactly what I feared you'd become."`,
      `"I don't know if I can follow someone who does this."`,
      `"You've changed... and not for the better."`,
      `*shakes head in disgust* "Is this really who you are?"`,
    ];
    return severeDialogues[Math.floor(Math.random() * severeDialogues.length)];
  }
  
  const mildDialogues = [
    `"I... don't agree with this."`,
    `"Was that really necessary?"`,
    `*frowns* "I would have done it differently."`,
    `"You and I see things very differently."`,
    `"I hope you know what you're doing."`,
  ];
  
  return mildDialogues[Math.floor(Math.random() * mildDialogues.length)];
}

export function generateTraitBasedNeutral(
  companion: CompanionState,
  actionType: PlayerActionType
): string {
  // Occasionally use personality-specific neutral responses
  const traits = companion.personality.traits;
  
  if (traits.includes('skeptical')) {
    const skepticalNeutral = [
      `*raises eyebrow* "Interesting choice."`,
      `"We'll see how that plays out."`,
      `*studying you* "Hmm."`,
    ];
    return skepticalNeutral[Math.floor(Math.random() * skepticalNeutral.length)];
  }
  
  if (traits.includes('pragmatic')) {
    const pragmaticNeutral = [
      `"One option of many."`,
      `"Acceptable."`,
      `*assessing* "Could work."`,
    ];
    return pragmaticNeutral[Math.floor(Math.random() * pragmaticNeutral.length)];
  }
  
  if (traits.includes('spiritual')) {
    const spiritualNeutral = [
      `"The spirits are... silent on this."`,
      `*meditating* "All paths lead somewhere."`,
      `"The universe watches."`,
    ];
    return spiritualNeutral[Math.floor(Math.random() * spiritualNeutral.length)];
  }
  
  return NEUTRAL_DIALOGUE_TEMPLATES[
    Math.floor(Math.random() * NEUTRAL_DIALOGUE_TEMPLATES.length)
  ];
}

// Generate hybrid dialogue combining multiple personality traits
export function generateHybridTraitDialogue(
  companion: CompanionState,
  actionType: PlayerActionType,
  sentiment: 'approve' | 'disapprove' | 'neutral'
): string {
  const traits = companion.personality.traits;
  
  if (traits.length < 2) {
    // Not enough traits for hybrid
    switch (sentiment) {
      case 'approve': return generateTraitBasedApproval(companion, actionType);
      case 'disapprove': return generateTraitBasedDisapproval(companion, actionType);
      default: return generateTraitBasedNeutral(companion, actionType);
    }
  }
  
  // Special hybrid combinations
  const traitSet = new Set(traits);
  
  // Honorable + Ruthless hybrid (conflicted warrior)
  if (traitSet.has('honorable') && traitSet.has('ruthless')) {
    if (actionType === 'combat_kill' && sentiment === 'approve') {
      return [
        `*conflicted nod* "They died with a chance to fight. That's... something."`,
        `"A warrior's death. Better than most deserve."`,
        `*grim satisfaction* "No suffering, just... efficiency. I can respect that."`,
      ][Math.floor(Math.random() * 3)];
    }
  }
  
  // Kind + Brave hybrid (heroic)
  if (traitSet.has('kind') && traitSet.has('brave')) {
    if (actionType === 'sacrifice' && sentiment === 'approve') {
      return [
        `*tearful but proud* "Brave AND selfless. You're a true hero."`,
        `"That took courage AND heart. I've never been more proud."`,
      ][Math.floor(Math.random() * 2)];
    }
  }
  
  // Greedy + Pragmatic hybrid (businessman)
  if (traitSet.has('greedy') && traitSet.has('pragmatic')) {
    if (actionType === 'theft' && sentiment === 'approve') {
      return [
        `*calculating nod* "Strategic resource acquisition. Good business."`,
        `"Low risk, high reward. The numbers check out."`,
      ][Math.floor(Math.random() * 2)];
    }
  }
  
  // Romantic + Brave hybrid (dramatic hero)
  if (traitSet.has('romantic') && traitSet.has('brave')) {
    if (actionType === 'bravery' && sentiment === 'approve') {
      return [
        `*swooning* "So heroic! Like something from a ballad!"`,
        `*clutches heart* "My hero... truly."`,
      ][Math.floor(Math.random() * 2)];
    }
  }
  
  // Vengeful + Loyal hybrid (protective avenger)
  if (traitSet.has('vengeful') && traitSet.has('loyal')) {
    if (actionType === 'combat_kill' && sentiment === 'approve') {
      return [
        `*fierce satisfaction* "They threatened our people. They paid for it."`,
        `"No one hurts ours and walks away. No one."`,
      ][Math.floor(Math.random() * 2)];
    }
  }
  
  // Fall back to single trait dialogue
  switch (sentiment) {
    case 'approve': return generateTraitBasedApproval(companion, actionType);
    case 'disapprove': return generateTraitBasedDisapproval(companion, actionType);
    default: return generateTraitBasedNeutral(companion, actionType);
  }
}

console.log('[PersonalityDialogue] Rich trait-based dialogue system loaded');
