/* AaharWalk — meal templates the planner builds real plates from.
 *
 * These are everyday Indian (mostly Maharashtrian) plates, not diet food.
 * `flex: true` marks the item the planner may scale up or down to hit a
 * calorie target — usually the bhakri/poli/rice, the way a real plate works.
 *
 * diet: 1 vegetarian · 2 needs egg · 3 non-vegetarian
 */

const t = (id, slot, diet, cuisine, tags, items) => ({ id, slot, diet, cuisine, tags, items });
const i = (foodId, qty, unit, flex = false) => ({ foodId, qty, unit, flex });

export const MEAL_IDEAS = [
  // ——— Breakfast ————————————————————————————————————————————————
  t("b_poha_egg", "breakfast", 2, "mh", ["quick", "protein"], [
    i("kanda_poha", 1, "bowl", true), i("boiled_egg", 2, "piece"), i("banana", 1, "piece")
  ]),
  t("b_poha_curd", "breakfast", 1, "mh", ["quick"], [
    i("kanda_poha", 1, "bowl", true), i("curd", 1, "bowl"), i("peanuts", 1, "tbsp")
  ]),
  t("b_thalipeeth", "breakfast", 1, "mh", ["fibre", "traditional"], [
    i("thalipeeth", 1, "piece", true), i("curd", 1, "bowl"), i("green_chutney", 1, "tbsp")
  ]),
  t("b_upma_sprouts", "breakfast", 1, "mh", ["fibre"], [
    i("upma", 1, "bowl", true), i("sprouts_salad", 0.5, "bowl"), i("buttermilk", 1, "glass")
  ]),
  t("b_idli_sambar", "breakfast", 1, "south", ["light", "low-oil"], [
    i("idli", 3, "piece", true), i("sambar", 1, "bowl"), i("coconut_chutney", 1, "tbsp")
  ]),
  t("b_dosa", "breakfast", 1, "south", ["traditional"], [
    i("dosa_plain", 2, "piece", true), i("sambar", 1, "bowl"), i("coconut_chutney", 1, "tbsp")
  ]),
  t("b_paratha_curd", "breakfast", 1, "north", ["filling"], [
    i("methi_paratha", 2, "piece", true), i("curd", 1, "bowl")
  ]),
  t("b_oats_fruit", "breakfast", 1, "generic", ["fibre", "quick"], [
    i("oats_porridge", 1, "bowl", true), i("banana", 1, "piece"), i("almonds", 8, "piece")
  ]),
  t("b_eggs_toast", "breakfast", 2, "generic", ["protein", "quick"], [
    i("omelette", 1, "piece"), i("brown_bread_slice", 2, "slice", true), i("apple", 1, "piece")
  ]),
  t("b_moong_chilla", "breakfast", 1, "north", ["protein", "fibre"], [
    i("dhokla", 1, "plate", true), i("green_chutney", 1, "tbsp"), i("buttermilk", 1, "glass")
  ]),
  t("b_khichdi_light", "breakfast", 1, "mh", ["light", "gut-friendly"], [
    i("khichdi", 1, "bowl", true), i("curd", 1, "bowl"), i("papad_roasted", 1, "piece")
  ]),

  // ——— Lunch ————————————————————————————————————————————————————
  t("l_bhakri_usal", "lunch", 1, "mh", ["fibre", "protein", "traditional"], [
    i("jowar_bhakri", 2, "piece", true), i("matki_usal", 1, "bowl"),
    i("bhendi_bhaji", 1, "bowl"), i("kachumber", 1, "bowl")
  ]),
  t("l_poli_varan_bhat", "lunch", 1, "mh", ["traditional", "comfort"], [
    i("chapati", 2, "piece", true), i("varan", 1, "bowl"),
    i("cooked_rice", 0.5, "bowl"), i("kobi_bhaji", 1, "bowl"), i("koshimbir", 1, "bowl")
  ]),
  t("l_bhakri_pithla", "lunch", 1, "mh", ["traditional"], [
    i("jowar_bhakri", 2, "piece", true), i("pithla", 1, "bowl"),
    i("onion_salad", 1, "plate"), i("buttermilk", 1, "glass")
  ]),
  t("l_dal_rice_sabzi", "lunch", 1, "generic", ["comfort"], [
    i("cooked_rice", 1, "bowl", true), i("toor_dal", 1, "bowl"),
    i("mixed_sabzi", 1, "bowl"), i("green_salad", 1, "plate")
  ]),
  t("l_rajma_rice", "lunch", 1, "punj", ["protein", "fibre"], [
    i("cooked_rice", 1, "bowl", true), i("rajma", 1, "bowl"), i("kachumber", 1, "bowl")
  ]),
  t("l_chole_roti", "lunch", 1, "punj", ["protein", "fibre"], [
    i("chapati", 2, "piece", true), i("chole", 1, "bowl"), i("onion_salad", 1, "plate")
  ]),
  t("l_curd_rice_sabzi", "lunch", 1, "south", ["light"], [
    i("curd_rice", 1, "bowl", true), i("beans_bhaji", 1, "bowl"), i("papad_roasted", 1, "piece")
  ]),
  t("l_bhakri_chicken", "lunch", 3, "mh", ["protein"], [
    i("jowar_bhakri", 2, "piece", true), i("chicken_curry", 1, "bowl"),
    i("onion_salad", 1, "plate"), i("kakdi", 1, "bowl")
  ]),
  t("l_fish_rice", "lunch", 3, "mh", ["protein", "heart"], [
    i("cooked_rice", 1, "bowl", true), i("fish_curry", 1, "bowl"),
    i("kobi_bhaji", 1, "bowl"), i("kachumber", 1, "bowl")
  ]),
  t("l_egg_curry_poli", "lunch", 2, "generic", ["protein"], [
    i("chapati", 2, "piece", true), i("egg_curry", 1, "bowl"), i("green_salad", 1, "plate")
  ]),
  t("l_khichdi_kadhi", "lunch", 1, "guj", ["comfort", "light"], [
    i("khichdi", 1, "bowl", true), i("kadhi", 1, "bowl"), i("kachumber", 1, "bowl")
  ]),
  t("l_sambar_rice", "lunch", 1, "south", ["fibre"], [
    i("cooked_rice", 1, "bowl", true), i("sambar", 1, "bowl"),
    i("gajar_beans", 1, "bowl"), i("curd", 0.5, "bowl")
  ]),

  // ——— Snack ————————————————————————————————————————————————————
  t("s_chai_chana", "snack", 1, "mh", ["protein", "low-sugar"], [
    i("tea_no_sugar", 1, "cup"), i("black_chana", 0.5, "bowl", true)
  ]),
  t("s_fruit_nuts", "snack", 1, "generic", ["heart", "fibre"], [
    i("apple", 1, "piece"), i("almonds", 10, "piece", true)
  ]),
  t("s_buttermilk_poha", "snack", 1, "mh", ["light"], [
    i("buttermilk", 1, "glass"), i("chivda", 1, "bowl", true)
  ]),
  t("s_sprouts_chat", "snack", 1, "mh", ["protein", "fibre"], [
    i("sprouts_salad", 1, "bowl", true), i("tea_no_sugar", 1, "cup")
  ]),
  t("s_curd_fruit", "snack", 1, "generic", ["protein"], [
    i("curd_lowfat", 1, "bowl", true), i("pomegranate", 1, "bowl")
  ]),
  t("s_egg_snack", "snack", 2, "generic", ["protein"], [
    i("boiled_egg", 2, "piece", true), i("kakdi", 1, "bowl")
  ]),
  t("s_chai_biscuit", "snack", 1, "generic", ["comfort"], [
    i("tea_milk_sugar", 1, "cup"), i("biscuit_marie", 2, "piece", true)
  ]),
  t("s_makhana_tea", "snack", 1, "generic", ["light"], [
    i("popcorn", 1, "bowl", true), i("black_tea", 1, "cup")
  ]),
  t("s_peanut_chai", "snack", 1, "mh", ["protein"], [
    i("peanuts", 2, "tbsp", true), i("tea_no_sugar", 1, "cup")
  ]),

  // ——— Dinner ——————————————————————————————————————————————————
  t("d_bhakri_usal_bhaji", "dinner", 1, "mh", ["fibre", "protein", "traditional"], [
    i("jowar_bhakri", 2, "piece", true), i("matki_usal", 1, "bowl"),
    i("bhendi_bhaji", 1, "bowl"), i("green_salad", 1, "plate")
  ]),
  t("d_poli_varan_bhaji", "dinner", 1, "mh", ["light", "traditional"], [
    i("chapati", 2, "piece", true), i("varan", 1, "bowl"),
    i("palak_bhaji", 1, "bowl"), i("koshimbir", 1, "bowl")
  ]),
  t("d_bhakri_zunka", "dinner", 1, "mh", ["traditional"], [
    i("bajra_bhakri", 2, "piece", true), i("zunka", 1, "bowl"),
    i("onion_salad", 1, "plate"), i("buttermilk", 1, "glass")
  ]),
  t("d_moong_khichdi", "dinner", 1, "generic", ["light", "gut-friendly"], [
    i("khichdi", 1, "bowl", true), i("curd", 1, "bowl"), i("kachumber", 1, "bowl")
  ]),
  t("d_poli_bhaji_dal", "dinner", 1, "generic", ["balanced"], [
    i("chapati", 2, "piece", true), i("moong_dal", 1, "bowl"),
    i("dudhi_bhaji", 1, "bowl"), i("green_salad", 1, "plate")
  ]),
  t("d_soup_salad_bhakri", "dinner", 1, "generic", ["light", "low-cal"], [
    i("veg_soup", 1, "bowl"), i("jowar_bhakri", 1, "piece", true),
    i("palak_bhaji", 1, "bowl"), i("sprouts_salad", 0.5, "bowl")
  ]),
  t("d_paneer_roti", "dinner", 1, "punj", ["protein"], [
    i("chapati", 2, "piece", true), i("palak_paneer", 1, "bowl"), i("kachumber", 1, "bowl")
  ]),
  t("d_grill_chicken_salad", "dinner", 3, "generic", ["protein", "low-carb"], [
    i("chicken_breast", 1, "piece", true), i("boiled_veg", 1, "bowl"),
    i("green_salad", 1, "plate"), i("jowar_bhakri", 1, "piece")
  ]),
  t("d_fish_bhakri", "dinner", 3, "mh", ["protein", "heart"], [
    i("jowar_bhakri", 2, "piece", true), i("fish_curry", 1, "bowl"), i("kobi_bhaji", 1, "bowl")
  ]),
  t("d_egg_bhurji_poli", "dinner", 2, "mh", ["protein", "quick"], [
    i("chapati", 2, "piece", true), i("egg_bhurji", 1, "bowl"), i("tomato_salad", 1, "bowl")
  ]),
  t("d_dal_rice_light", "dinner", 1, "generic", ["comfort"], [
    i("cooked_rice", 0.75, "bowl", true), i("varan", 1, "bowl"),
    i("gobi_bhaji", 1, "bowl"), i("kakdi", 1, "bowl")
  ]),
  t("d_chana_usal_bhakri", "dinner", 1, "mh", ["protein", "fibre"], [
    i("nachni_bhakri", 2, "piece", true), i("chana_usal", 1, "bowl"),
    i("methi_bhaji", 1, "bowl"), i("buttermilk", 1, "glass")
  ]),
  t("d_sambar_idli", "dinner", 1, "south", ["light"], [
    i("idli", 3, "piece", true), i("sambar", 1, "bowl"), i("coconut_chutney", 1, "tbsp")
  ])
];

export const IDEAS_BY_SLOT = MEAL_IDEAS.reduce((acc, idea) => {
  (acc[idea.slot] = acc[idea.slot] || []).push(idea);
  return acc;
}, {});
