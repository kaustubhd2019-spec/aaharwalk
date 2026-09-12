/* AaharWalk — home exercise library.
 * Everything here works in a small room. `equip: "none"` needs nothing at all.
 * `met` is used only for a conservative calorie estimate.
 */

export const EQUIPMENT = {
  none: { en: "No equipment", mr: "काहीही नाही" },
  mat: { en: "Yoga mat", mr: "योगा मॅट" },
  dumbbell: { en: "Dumbbells", mr: "डंबेल्स" },
  band: { en: "Resistance band", mr: "रेझिस्टन्स बँड" },
  chair: { en: "Sturdy chair", mr: "मजबूत खुर्ची" },
  skiprope: { en: "Skipping rope", mr: "उड्या दोरी" }
};

/* [id, name, marathi, type, level(1-3), equip, met, cue] */
const ROWS = [
  // — warm-up / mobility —
  ["march", "March in place", "जागेवर चालणे", "warmup", 1, "none", 3.5, "Lift each knee to hip height, swing the arms."],
  ["shoulder_rolls", "Shoulder rolls", "खांदे फिरवणे", "warmup", 1, "none", 2.5, "Big slow circles, backwards then forwards."],
  ["neck_release", "Neck release", "मान मोकळी करणे", "warmup", 1, "none", 2.0, "Ear towards shoulder, breathe, no bouncing."],
  ["cat_cow", "Cat–cow", "मार्जरासन", "mobility", 1, "mat", 2.5, "On all fours: arch on the inhale, round on the exhale."],
  ["hip_circles", "Hip circles", "कंबर फिरवणे", "warmup", 1, "none", 2.8, "Hands on hips, slow wide circles both ways."],
  ["ankle_wrist", "Ankle & wrist circles", "घोटा-मनगट फिरवणे", "warmup", 1, "none", 2.0, "Ten circles each way, both sides."],
  ["arm_swings", "Arm swings", "हात झुलवणे", "warmup", 1, "none", 3.0, "Open the chest wide, then cross in front."],
  ["side_bend", "Standing side bend", "बाजूला वाकणे", "mobility", 1, "none", 2.5, "Reach one arm overhead, lean gently sideways."],

  // — cardio —
  ["spot_jog", "Jog on the spot", "जागेवर धावणे", "cardio", 2, "none", 6.0, "Light on the feet, land softly."],
  ["step_touch", "Step touch", "स्टेप टच", "cardio", 1, "none", 4.0, "Step side to side, swing the arms with it."],
  ["knee_lifts", "High knees (easy)", "गुडघे उचलणे", "cardio", 2, "none", 5.5, "Keep it controlled — height over speed."],
  ["butt_kicks", "Heel flicks", "टाच मागे", "cardio", 2, "none", 5.5, "Flick heels towards the seat, stay tall."],
  ["jumping_jacks", "Jumping jacks", "जंपिंग जॅक्स", "cardio", 2, "none", 7.0, "Arms fully overhead, soft knees."],
  ["low_jacks", "Low-impact jacks", "कमी दणक्याचे जॅक्स", "cardio", 1, "none", 4.5, "Step out instead of jumping — easy on the knees."],
  ["shadow_box", "Shadow boxing", "शॅडो बॉक्सिंग", "cardio", 2, "none", 5.5, "Punch across the body, rotate the back foot."],
  ["skip_rope", "Skipping", "दोरीच्या उड्या", "cardio", 3, "skiprope", 9.0, "Small jumps, wrists doing the work."],
  ["fast_walk_room", "Brisk indoor walk", "घरातच वेगात चालणे", "cardio", 1, "none", 4.0, "Walk the length of the room briskly, arms swinging."],

  // — strength —
  ["squat", "Bodyweight squat", "स्क्वॅट", "strength", 2, "none", 5.0, "Chest up, knees tracking over the toes."],
  ["chair_squat", "Chair squat", "खुर्चीवर बसणे-उठणे", "strength", 1, "chair", 4.0, "Sit down lightly, stand up without using hands."],
  ["wall_pushup", "Wall push-up", "भिंतीवर पुशअप", "strength", 1, "none", 3.5, "Body in one line, elbows at 45°."],
  ["knee_pushup", "Knee push-up", "गुडघ्यावर पुशअप", "strength", 2, "mat", 4.5, "Hips level with shoulders, lower with control."],
  ["pushup", "Push-up", "पुशअप", "strength", 3, "mat", 6.0, "Full plank, chest towards the floor."],
  ["glute_bridge", "Glute bridge", "ब्रिज", "strength", 1, "mat", 3.5, "Squeeze at the top, ribs down."],
  ["bird_dog", "Bird dog", "बर्ड डॉग", "strength", 1, "mat", 3.0, "Opposite arm and leg, no wobble in the hips."],
  ["plank", "Plank", "प्लँक", "strength", 2, "mat", 3.5, "Straight line, belly gently braced."],
  ["side_plank", "Side plank", "साईड प्लँक", "strength", 2, "mat", 3.5, "Stack the shoulders, lift the hips."],
  ["reverse_lunge", "Reverse lunge", "मागे लंज", "strength", 2, "none", 5.0, "Step back, knee down softly, push through the front heel."],
  ["calf_raise", "Calf raise", "टाच उचलणे", "strength", 1, "none", 3.0, "Rise slowly, pause at the top."],
  ["superman", "Superman hold", "सुपरमॅन", "strength", 1, "mat", 3.0, "Lift chest and thighs slightly, look down."],
  ["dead_bug", "Dead bug", "डेड बग", "strength", 1, "mat", 3.0, "Lower back stays glued to the floor."],
  ["chair_dip", "Chair dip", "खुर्ची डिप", "strength", 2, "chair", 4.5, "Elbows point straight back, shoulders down."],
  ["wall_sit", "Wall sit", "भिंत बैठक", "strength", 2, "none", 4.0, "Thighs parallel if you can, breathe steadily."],
  ["db_row", "Dumbbell row", "डंबेल रो", "strength", 2, "dumbbell", 5.0, "Flat back, pull the elbow past the ribs."],
  ["db_press", "Dumbbell shoulder press", "डंबेल प्रेस", "strength", 2, "dumbbell", 5.0, "Press overhead without arching the back."],
  ["db_curl", "Dumbbell curl", "डंबेल कर्ल", "strength", 1, "dumbbell", 3.5, "Elbows pinned to the sides."],
  ["band_pull", "Band pull-apart", "बँड पुल", "strength", 1, "band", 3.5, "Open the chest, squeeze the shoulder blades."],
  ["band_squat", "Band squat", "बँड स्क्वॅट", "strength", 2, "band", 5.0, "Push the knees out against the band."],

  // — yoga —
  ["tadasana", "Tadasana", "ताडासन", "yoga", 1, "mat", 2.5, "Stand tall, weight even, breathe into the ribs."],
  ["surya_a", "Surya Namaskar (slow)", "सूर्यनमस्कार", "yoga", 2, "mat", 4.0, "One round per breath cycle, no rushing."],
  ["vrikshasana", "Vrikshasana", "वृक्षासन", "yoga", 1, "mat", 2.5, "Foot above or below the knee, never on it."],
  ["trikonasana", "Trikonasana", "त्रिकोणासन", "yoga", 2, "mat", 3.0, "Lengthen the side body before you bend."],
  ["bhujangasana", "Bhujangasana", "भुजंगासन", "yoga", 1, "mat", 2.8, "Elbows soft, shoulders away from the ears."],
  ["balasana", "Balasana", "बालासन", "yoga", 1, "mat", 2.0, "Knees wide, forehead down, slow breathing."],
  ["setu_bandha", "Setu Bandhasana", "सेतुबंधासन", "yoga", 1, "mat", 3.0, "Press the feet down, lift the hips gently."],
  ["paschimottan", "Paschimottanasana", "पश्चिमोत्तानासन", "yoga", 2, "mat", 2.5, "Hinge from the hips, keep the spine long."],
  ["virabhadra", "Virabhadrasana II", "वीरभद्रासन", "yoga", 2, "mat", 3.2, "Front knee over the ankle, arms long."],
  ["marjari_flow", "Marjariasana flow", "मार्जरी प्रवाह", "yoga", 1, "mat", 2.5, "Move with the breath, not with the clock."],
  ["shavasana", "Shavasana", "शवासन", "yoga", 1, "mat", 1.3, "Let everything go heavy. Nothing to do here."],
  ["anulom", "Anulom Vilom", "अनुलोम विलोम", "yoga", 1, "none", 1.5, "Even, unforced breathing through alternate nostrils."],

  // — cooldown —
  ["ham_stretch", "Hamstring stretch", "मांडीचा स्ट्रेच", "cooldown", 1, "none", 2.0, "Soft knee, hinge forward until you feel a pull."],
  ["quad_stretch", "Quad stretch", "पुढील मांडीचा स्ट्रेच", "cooldown", 1, "none", 2.0, "Knees together, hold something for balance."],
  ["chest_stretch", "Chest stretch", "छातीचा स्ट्रेच", "cooldown", 1, "none", 2.0, "Hand on the wall, turn away slowly."],
  ["child_rest", "Rest & breathe", "विश्रांती", "cooldown", 1, "none", 1.5, "Slow breath out, twice as long as the breath in."]
];

const KEYS = ["id", "name", "mr", "type", "level", "equip", "met", "cue"];
export const EXERCISES = ROWS.map(row => Object.fromEntries(KEYS.map((k, i) => [k, row[i]])));
export const EXERCISE_BY_ID = Object.fromEntries(EXERCISES.map(e => [e.id, e]));
