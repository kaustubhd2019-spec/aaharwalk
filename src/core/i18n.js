/* AaharWalk — English / Marathi interface strings. */

import { getState, update } from "./store.js";

const STRINGS = {
  en: {
    appName: "AaharWalk",
    tagline: "Your food, walking and home-workout coach",

    nav_home: "Home", nav_food: "Food", nav_activity: "Activity", nav_plan: "Plan", nav_profile: "Profile",

    today: "Today", yesterday: "Yesterday",
    calories: "Calories", steps: "Steps", water: "Water", protein: "Protein", fibre: "Fibre",
    consumed: "Eaten", target: "Target", remaining: "Left", over: "over",
    kcal: "kcal", grams: "g", litres: "L",

    quick_actions: "Quick actions",
    log_food: "Log food", add_water: "Water", log_weight: "Weight",
    start_workout: "Start workout", log_steps: "Log steps", plan_meals: "Plan meals",

    your_coach: "Your coach",
    todays_workout: "Today's session",
    end_of_day: "Today's summary",
    whats_next: "What to eat next",
    view_plan: "Plan my day",

    what_did_you_eat: "What did you eat?",
    food_input_hint: "Type it the way you'd say it — “2 bhakri, 1 वाटी मटकीची उसळ, half bowl bhendi”",
    parse: "Check it",
    add_to_log: "Add to today's log",
    clear: "Clear",
    estimated: "Estimated",
    total: "Total",
    which_one: "Which one?",
    which_meal: "Which meal?",
    edit: "Edit", remove: "Remove", save: "Save", cancel: "Cancel", done: "Done",
    portion: "Portion", cooking_oil: "Cooking oil",
    not_recognised: "Not recognised",
    add_manually: "Search the food list instead",
    search_foods: "Search foods",
    favourites: "Saved meals", save_as_favourite: "Save as a meal",
    repeat_yesterday: "Repeat yesterday's",
    frequently_eaten: "You eat these often",

    breakfast: "Breakfast", midmorning: "Mid-morning", lunch: "Lunch",
    snack: "Evening snack", dinner: "Dinner", other: "Other",

    step_source: "Where do your steps come from?",
    paste_steps: "Paste from that app",
    walk_mode: "Walk mode",
    start_walk: "Count my walk",
    counting_on_phone: "This phone is counting",
    counting: "Counting",
    ready_to_walk: "Ready when you are",
    paused_label: "Paused",
    waiting_for_sensor: "Starting the sensor…",
    duration: "Time",
    distance: "Distance",
    walk_done: "Walk saved",
    keep_these_steps: "Keep these steps?",
    discard: "Discard",
    settings_label: "Settings",
    step_sensitivity: "Step sensitivity",
    sensitivity_hint: "If it counts too many or too few, adjust this and walk 20 steps to check.",
    walk_note: "Keep the app open — pocket the phone and the screen stays awake.",
    sensor_silent: "No movement readings yet. Some browsers only allow this over HTTPS, or the phone may not be sharing motion data.",
    walk_limits: "A web app can only count while it is open — browsers stop sensors once the screen locks. For a whole day's total, share or paste the number from Step Set Go or Google Fit instead.",
    motion_denied: "Motion access was declined, so the phone can't count steps. You can still type or paste the number.",
    walk_needs_https: "Counting steps needs a secure (https://) page. Host the app on HTTPS and it will work.",
    walk_no_sensor: "This device or browser doesn't provide motion readings, so the app can't count steps itself.",
    walk_alternative: "You can still type today's steps in, or paste them from Step Set Go or Google Fit.",
    counted_by_app: "counted by the app",
    native_denied: "Without activity permission the phone can't share its step count. You can still type or paste it.",
    native_already_counted: "Your phone was already counting these steps, so today's total hasn't been added to twice.",
    native_syncing: "Today's steps come from your phone's own counter.",
    activity_title: "Activity",
    todays_steps: "Today's steps", weekly_average: "7-day average", step_goal: "Step goal",
    last_7_days: "Last 7 days", weight: "Weight", weight_trend: "Weight trend",
    workout_history: "Recent sessions", workouts_done: "Workouts",

    plan_title: "Plan",
    generate_plan: "Make today's plan", regenerate: "Try another plan",
    weekly_report: "This week", this_week: "This week",
    avg_calories: "Average calories", avg_steps: "Average steps", avg_water: "Average water",

    profile_title: "Profile",
    your_targets: "Your targets", edit_profile: "Edit details",
    language: "Language", reminders: "Reminders", data_privacy: "Your data",
    export_backup: "Export a backup", import_backup: "Restore a backup",
    reset_app: "Erase everything", demo_data: "Load sample data",

    start: "Start", pause: "Pause", resume: "Resume", skip: "Skip", finish: "Finish",
    rest: "Rest", next_up: "Next", round: "Round", well_done: "Great work",
    how_was_it: "How did that feel?", easy: "Easy", just_right: "Just right", hard: "Hard",

    disclaimer: "These numbers are estimates based on what you tell the app. If you have a medical condition, take medication, or your doctor has set you specific dietary limits, follow your doctor's advice.",
    estimate_note: "Estimated from a typical home preparation.",

    onboard_welcome: "Let's set up your coach",
    onboard_sub: "Six short steps. Everything stays on this phone.",
    next: "Next", back: "Back", finish_setup: "Finish setup",

    name: "Your name", age: "Age", gender: "Gender",
    male: "Male", female: "Female", other_gender: "Prefer not to say",
    height: "Height", current_weight: "Current weight", target_weight: "Target weight",
    activity_level: "How active is your usual day?",
    typical_steps: "Steps on a typical day",
    goal_q: "What are you here for?",
    diet_q: "What do you eat?",
    veg: "Vegetarian", egg: "Eggetarian", nonveg: "Non-vegetarian",
    cuisines_q: "Which food do you eat most?",
    avoid_q: "Anything to avoid? (allergies, dislikes)",
    avoid_hint: "Comma separated — e.g. peanut, brinjal",
    sleep_q: "Hours of sleep, usually",
    water_now_q: "Water you drink now (litres)",
    exercise_q: "How much do you exercise now?",
    beginner: "Just starting", some: "On and off", regular: "Regularly",
    equipment_q: "What do you have at home?",
    heart_q: "Would you like heart-friendly eating prioritised?",
    doctor_q: "Has a doctor given you specific dietary limits?",
    doctor_note: "We won't try to replace that advice — the app will just remind you to follow it.",
    yes: "Yes", no: "No",

    saved: "Saved", nothing_logged: "Nothing logged yet",
    no_food_yet: "No food logged yet today. Tap “Log food” and just type what you ate.",
    no_steps_yet: "No steps yet today.",
    per_day: "per day", of: "of"
  },

  mr: {
    appName: "आहारवॉक",
    tagline: "तुमचा आहार, चालणं आणि घरच्या व्यायामाचा सोबती",

    nav_home: "होम", nav_food: "आहार", nav_activity: "हालचाल", nav_plan: "नियोजन", nav_profile: "प्रोफाईल",

    today: "आज", yesterday: "काल",
    calories: "कॅलरीज", steps: "पावलं", water: "पाणी", protein: "प्रथिनं", fibre: "तंतुमय",
    consumed: "घेतलं", target: "लक्ष्य", remaining: "शिल्लक", over: "जास्त",
    kcal: "kcal", grams: "ग्रॅम", litres: "लिटर",

    quick_actions: "पटकन नोंद",
    log_food: "जेवण नोंदवा", add_water: "पाणी", log_weight: "वजन",
    start_workout: "व्यायाम सुरू", log_steps: "पावलं नोंदवा", plan_meals: "जेवणाचं नियोजन",

    your_coach: "तुमचा सल्लागार",
    todays_workout: "आजचा व्यायाम",
    end_of_day: "आजचा आढावा",
    whats_next: "पुढे काय खावं",
    view_plan: "आजचं नियोजन",

    what_did_you_eat: "काय खाल्लं?",
    food_input_hint: "जसं बोलता तसं लिहा — “२ भाकरी, १ वाटी मटकीची उसळ, अर्धी वाटी भेंडी”",
    parse: "तपासा",
    add_to_log: "आजच्या नोंदीत टाका",
    clear: "पुसा",
    estimated: "अंदाजे",
    total: "एकूण",
    which_one: "कोणती?",
    which_meal: "कोणतं जेवण?",
    edit: "बदला", remove: "काढा", save: "जतन करा", cancel: "रद्द", done: "झालं",
    portion: "प्रमाण", cooking_oil: "तेल",
    not_recognised: "ओळखता आलं नाही",
    add_manually: "यादीतून शोधा",
    search_foods: "पदार्थ शोधा",
    favourites: "जतन केलेली जेवणं", save_as_favourite: "जेवण जतन करा",
    repeat_yesterday: "कालचंच पुन्हा",
    frequently_eaten: "तुम्ही नेहमी खाता",

    breakfast: "न्याहारी", midmorning: "मधल्या वेळेत", lunch: "दुपारचे जेवण",
    snack: "संध्याकाळचा नाश्ता", dinner: "रात्रीचे जेवण", other: "इतर",

    step_source: "पावलांचा आकडा कुठून येतो?",
    paste_steps: "त्या अ‍ॅपमधून पेस्ट करा",
    walk_mode: "चालण्याचा मोड",
    start_walk: "चालणं मोजा",
    counting_on_phone: "हा फोन मोजतो आहे",
    counting: "मोजणं सुरू",
    ready_to_walk: "तयार आहे",
    paused_label: "थांबवलं",
    waiting_for_sensor: "सेन्सर सुरू होतो आहे…",
    duration: "वेळ",
    distance: "अंतर",
    walk_done: "चालणं नोंदवलं",
    keep_these_steps: "ही पावलं ठेवायची?",
    discard: "नको",
    settings_label: "सेटिंग्ज",
    step_sensitivity: "पावलांची संवेदनशीलता",
    sensitivity_hint: "जास्त किंवा कमी मोजलं जात असेल, तर हे बदला आणि २० पावलं चालून बघा.",
    walk_note: "अ‍ॅप उघडं ठेवा — फोन खिशात ठेवला तरी स्क्रीन चालू राहील.",
    sensor_silent: "अजून हालचाल दिसत नाही. काही ब्राउझरमध्ये हे फक्त HTTPS वर चालतं, किंवा फोन हालचालीची माहिती देत नसेल.",
    walk_limits: "वेब अ‍ॅप फक्त उघडं असतानाच मोजू शकतं — स्क्रीन बंद झाल्यावर ब्राउझर सेन्सर थांबवतो. पूर्ण दिवसाच्या आकड्यासाठी Step Set Go किंवा Google Fit मधून शेअर किंवा पेस्ट करा.",
    motion_denied: "हालचालीची परवानगी नाकारली, त्यामुळे फोन पावलं मोजू शकत नाही. आकडा लिहू किंवा पेस्ट करू शकता.",
    walk_needs_https: "पावलं मोजण्यासाठी सुरक्षित (https://) पेज लागतं. अ‍ॅप HTTPS वर ठेवलं की चालेल.",
    walk_no_sensor: "या फोनवर किंवा ब्राउझरमध्ये हालचालीची माहिती मिळत नाही, त्यामुळे अ‍ॅप स्वतः पावलं मोजू शकत नाही.",
    walk_alternative: "तुम्ही आजची पावलं लिहू शकता, किंवा Step Set Go / Google Fit मधून पेस्ट करू शकता.",
    counted_by_app: "अ‍ॅपने मोजलेली",
    native_denied: "हालचालीच्या परवानगीशिवाय फोन पावलांचा आकडा देऊ शकत नाही. तुम्ही तो लिहू किंवा पेस्ट करू शकता.",
    native_already_counted: "ही पावलं फोननेही मोजली होती, त्यामुळे आजच्या आकड्यात दोनदा जोडली गेलेली नाहीत.",
    native_syncing: "आजची पावलं फोनच्या स्वतःच्या काउंटरमधून येतात.",
    activity_title: "हालचाल",
    todays_steps: "आजची पावलं", weekly_average: "७ दिवसांची सरासरी", step_goal: "पावलांचं लक्ष्य",
    last_7_days: "मागील ७ दिवस", weight: "वजन", weight_trend: "वजनाचा कल",
    workout_history: "अलीकडचे व्यायाम", workouts_done: "व्यायाम",

    plan_title: "नियोजन",
    generate_plan: "आजचं नियोजन करा", regenerate: "दुसरं नियोजन",
    weekly_report: "हा आठवडा", this_week: "हा आठवडा",
    avg_calories: "सरासरी कॅलरीज", avg_steps: "सरासरी पावलं", avg_water: "सरासरी पाणी",

    profile_title: "प्रोफाईल",
    your_targets: "तुमची लक्ष्यं", edit_profile: "माहिती बदला",
    language: "भाषा", reminders: "स्मरणपत्रं", data_privacy: "तुमचा डेटा",
    export_backup: "बॅकअप घ्या", import_backup: "बॅकअप परत आणा",
    reset_app: "सर्व पुसून टाका", demo_data: "नमुना माहिती भरा",

    start: "सुरू", pause: "थांबा", resume: "पुढे", skip: "वगळा", finish: "संपलं",
    rest: "विश्रांती", next_up: "पुढे", round: "फेरी", well_done: "छान काम",
    how_was_it: "कसं वाटलं?", easy: "सोपं", just_right: "बरोबर", hard: "जड",

    disclaimer: "हे आकडे तुम्ही दिलेल्या माहितीवरून काढलेले अंदाज आहेत. तुम्हाला काही आजार असेल, औषधं सुरू असतील किंवा डॉक्टरांनी विशिष्ट आहार सांगितला असेल, तर डॉक्टरांचा सल्ला पाळा.",
    estimate_note: "नेहमीच्या घरगुती पद्धतीनुसार अंदाज.",

    onboard_welcome: "चला, सुरुवात करूया",
    onboard_sub: "सहा छोटे टप्पे. सगळी माहिती याच फोनमध्ये राहते.",
    next: "पुढे", back: "मागे", finish_setup: "पूर्ण करा",

    name: "तुमचं नाव", age: "वय", gender: "लिंग",
    male: "पुरुष", female: "स्त्री", other_gender: "सांगू इच्छित नाही",
    height: "उंची", current_weight: "सध्याचं वजन", target_weight: "लक्ष्य वजन",
    activity_level: "तुमचा नेहमीचा दिवस किती हालचालीचा असतो?",
    typical_steps: "नेहमीच्या दिवसातली पावलं",
    goal_q: "तुमचं उद्दिष्ट काय?",
    diet_q: "तुम्ही काय खाता?",
    veg: "शाकाहारी", egg: "अंडी चालतात", nonveg: "मांसाहारी",
    cuisines_q: "कोणतं जेवण जास्त करता?",
    avoid_q: "काही टाळायचं आहे का? (अॅलर्जी, आवडत नाही)",
    avoid_hint: "स्वल्पविरामाने वेगळं करा — उदा. शेंगदाणा, वांगं",
    sleep_q: "साधारण किती तास झोप?",
    water_now_q: "सध्या किती पाणी पिता (लिटर)",
    exercise_q: "सध्या किती व्यायाम करता?",
    beginner: "नुकतीच सुरुवात", some: "कधीतरी", regular: "नियमित",
    equipment_q: "घरी काय उपलब्ध आहे?",
    heart_q: "हृदयासाठी पूरक आहाराला प्राधान्य द्यायचं का?",
    doctor_q: "डॉक्टरांनी काही विशिष्ट आहार सांगितला आहे का?",
    doctor_note: "तो सल्ला आम्ही बदलणार नाही — फक्त तो पाळण्याची आठवण करून देऊ.",
    yes: "होय", no: "नाही",

    saved: "जतन झालं", nothing_logged: "अजून काही नोंदवलेलं नाही",
    no_food_yet: "आज अजून जेवण नोंदवलेलं नाही. “जेवण नोंदवा” दाबा आणि जे खाल्लं ते लिहा.",
    no_steps_yet: "आज अजून पावलं नोंदवलेली नाहीत.",
    per_day: "दररोज", of: "पैकी"
  }
};

export function lang() {
  return getState().settings.lang || "en";
}

export function setLang(value) {
  update(s => { s.settings.lang = value; });
  document.documentElement.lang = value === "mr" ? "mr" : "en";
}

/** t("calories") → "Calories" / "कॅलरीज" */
export function t(key) {
  const current = lang();
  return (STRINGS[current] && STRINGS[current][key]) || STRINGS.en[key] || key;
}

/** Pick from a {en, mr} pair produced by the coach engine. */
export function pick(pair) {
  if (!pair) return "";
  return pair[lang()] || pair.en || "";
}

export function localeCode() {
  return lang() === "mr" ? "mr-IN" : "en-IN";
}

/** Food and exercise names carry their own Marathi field. */
export function nameOf(entity) {
  if (!entity) return "";
  return lang() === "mr" && entity.mr ? entity.mr : entity.name;
}
