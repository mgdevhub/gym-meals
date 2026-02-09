import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { registerRootComponent } from 'expo';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as ImagePicker from 'expo-image-picker';
import { Component, createContext, createRef, useContext, useEffect, useRef, useState } from 'react';

export const navigationRef = createRef();

import { ActivityIndicator, Alert, FlatList, Image, LogBox, Modal, ScrollView, SectionList, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import AuthScreen from './AuthScreen';
import { analyzeFoodPhoto } from './GeminiService';

// Suppress deprecated warnings for demo clarity
LogBox.ignoreLogs([
    'ImagePicker.MediaTypeOptions',
    'have been deprecated',
    'expo-image-picker',
]);

// --- ERROR BOUNDARY (Crash Prevention) ---
class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('App Error:', error, errorInfo);
        // In production, could send to error tracking service
    }

    render() {
        if (this.state.hasError) {
            return (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212', padding: 20 }}>
                    <Text style={{ color: '#FF4444', fontSize: 24, fontWeight: 'bold', marginBottom: 10 }}>⚠️ Error Occurred</Text>
                    <Text style={{ color: '#CCCCCC', fontSize: 16, textAlign: 'center', marginBottom: 20 }}>
                        The app encountered an unexpected error. Please restart the application.
                    </Text>
                    <TouchableOpacity
                        style={{ backgroundColor: '#00E676', padding: 15, borderRadius: 10 }}
                        onPress={() => this.setState({ hasError: false, error: null })}
                    >
                        <Text style={{ color: '#000', fontWeight: 'bold' }}>Try Again</Text>
                    </TouchableOpacity>
                </View>
            );
        }
        return this.props.children;
    }
}

// --- THEME & COLORS ---
const COLORS = {
    background: '#121212',
    card: '#1E1E1E',
    primary: '#CCFF00', // Neon Volt (Gym Style)
    secondary: '#333333',
    text: '#FFFFFF',
    textSecondary: '#AAAAAA',
    danger: '#FF4444',
    success: '#00C851'
};

const THEME = {
    ...DarkTheme,
    colors: {
        ...DarkTheme.colors,
        background: COLORS.background,
        card: COLORS.card,
        text: COLORS.text,
        border: COLORS.secondary,
        primary: COLORS.primary,
    },
};

// --- MOCK DATA ---
const RECIPES = [
    {
        id: 'r1',
        title: 'Power Chicken & Rice',
        time: '20 min',
        calories: '550 kcal',
        protein: '45g',
        image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=800&q=80',
        description: 'Legendary post-workout meal for muscle repair. Clean carbs, high protein.',
        timing: ['post-workout', 'lunch', 'dinner'],
        difficulty: 'medium',
        caloriesNum: 550,
        proteinNum: 45,
        ingredients: [
            { id: '101', name: 'Chicken Breast', quantity: '1 piece (~200g)', category: 'Protein' },
            { id: '102', name: 'Basmati Rice (Dry)', quantity: '100g (1/2 cup)', category: 'Carbohydrate' },
            { id: '103', name: 'Broccoli', quantity: '150g (1 medium head)', category: 'Vegetable' },
            { id: '104', name: 'Olive Oil', quantity: '1 tsp', category: 'Fat' },
            { id: '105', name: 'Black Pepper + Sea Salt', quantity: 'To taste', category: 'Spice' },
        ],
        steps: [
            '1. **Rice:** Rinse 100g rice thoroughly (remove starch). Boil with 200ml water + pinch of salt. Cover and simmer on low heat for 12 min. Remove from heat, let sit for 5 min.',
            '2. **Chicken:** Pat dry chicken breast, season both sides with salt & pepper. Heat pan/grill to 180°C, coat with 1 tsp olive oil.',
            '3. **Chicken (cont):** Cook chicken 6-7 min per side (12-14 min total). Internal temp should be 74°C. Wrap in foil, rest for 5 min (juices reabsorb).',
            '4. **Broccoli:** Cut broccoli into florets, boil in salted water for 4 min (keep crisp). Shock in cold water to keep color.',
            '5. **Serve:** Spread rice, slice chicken diagonally on top. Add broccoli on side. Squeeze lemon, serve hot. Enjoy!'
        ]
    },
    {
        id: 'r2',
        title: 'Oatmeal Protein Bowl',
        time: '5 min',
        calories: '400 kcal',
        protein: '30g',
        image: 'https://images.unsplash.com/photo-1517673400267-0251440c45dc?q=80&w=1000&auto=format&fit=crop',
        description: 'Feel energized in the morning. No sugar, purely natural power.',
        timing: ['breakfast', 'snack'],
        difficulty: 'easy',
        caloriesNum: 400,
        proteinNum: 30,
        ingredients: [
            { id: '201', name: 'Oats', quantity: '60g (2/3 cup)', category: 'Grain' },
            { id: '202', name: 'Whey Protein Powder', quantity: '30g (1 scoop)', category: 'Supplement' },
            { id: '203', name: 'Peanut Butter (Natural)', quantity: '1 tbsp (15g)', category: 'Fat' },
            { id: '204', name: 'Banana (Ripe)', quantity: '1 medium', category: 'Fruit' },
            { id: '205', name: 'Hot Water / Milk', quantity: '150ml', category: 'Liquid' },
        ],
        steps: [
            '1. **Oats:** Put 60g oats in a bowl, pour 150ml boiling water/milk. Stir and wait 2 mins (to soften).',
            '2. **Protein:** Add 30g protein powder, stir well for 30 secs. Texture will thicken (add 1-2 tsp water if too thick).',
            '3. **Banana:** Slice banana thinly (5-6mm), arrange decoratively on top.',
            '4. **Peanut Butter:** Drizzle 1 tbsp peanut butter over the oats in a pattern.',
            '5. **Serve:** Let sit 2-3 mins (warm is best). Sprinkle cinnamon if desired. Enjoy!'
        ]
    },
    {
        id: 'r3',
        title: 'Avocado & Egg Toast',
        time: '10 min',
        calories: '350 kcal',
        protein: '20g',
        image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?q=80&w=1000&auto=format&fit=crop',
        description: 'Quality fats, quality protein. Brain food.',
        timing: ['breakfast'],
        difficulty: 'easy',
        caloriesNum: 350,
        proteinNum: 20,
        ingredients: [
            { id: '301', name: 'Whole Wheat/Rye Bread', quantity: '2 thick slices (~80g)', category: 'Carbohydrate' },
            { id: '302', name: 'Egg (Fresh)', quantity: '2 large', category: 'Protein' },
            { id: '303', name: 'Avocado (Hass)', quantity: '1/2 (~80g)', category: 'Fat' },
            { id: '304', name: 'Lemon Juice', quantity: '1 tsp', category: 'Acid' },
            { id: '305', name: 'Olive Oil', quantity: '1 dash', category: 'Fat' },
            { id: '306', name: 'Sea Salt + Black Pepper', quantity: 'To taste', category: 'Spice' },
        ],
        steps: [
            '1. **Bread:** Toast 2 slices of bread until golden and crispy (3-4 mins). Use a dash of olive oil if pan-frying.',
            '2. **Egg:** Fry eggs in a separate pan with a dash of oil on low heat. Cover lid for 4-5 mins (sunny-side up). Season.',
            '3. **Avocado:** Halve avocado, remove pit. Scoop out flesh, mash with fork. Mix in lemon juice, salt, pepper.',
            '4. **Assemble:** Spread avocado mash generously on toast. Carefully place egg on top.',
            '5. **Serve:** Sprinkle red pepper flakes or fresh basil if desired. Serve immediately!'
        ]
    },
    {
        id: 'r4',
        title: 'Grilled Salmon & Quinoa',
        time: '25 min',
        calories: '480 kcal',
        protein: '38g',
        image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=800&q=80',
        description: 'Omega-3 powerhouse. Super combo for muscle repair and brain health.',
        timing: ['lunch', 'dinner'],
        difficulty: 'medium',
        caloriesNum: 480,
        proteinNum: 38,
        ingredients: [
            { id: '401', name: 'Salmon Fillet', quantity: '180g (~1 piece)', category: 'Protein' },
            { id: '402', name: 'Quinoa (Dry)', quantity: '80g (1/2 cup)', category: 'Grain' },
            { id: '403', name: 'Fresh Spinach', quantity: '100g (2 handfuls)', category: 'Vegetable' },
            { id: '404', name: 'Lemon', quantity: '1 whole', category: 'Acid' },
            { id: '405', name: 'Olive Oil', quantity: '1 tbsp', category: 'Fat' },
            { id: '406', name: 'Sea Salt + Black Pepper', quantity: 'To taste', category: 'Spice' },
        ],
        steps: [
            '1. **Quinoa:** Rinse 80g quinoa thoroughly. Boil with 160ml water + pinch of salt. Simmer 15 mins. Remove from heat, let rest 5 mins.',
            '2. **Salmon:** Pat dry fillet, season both sides. Heat pan/grill to medium-high. Cook skin-side down first for 4 mins (until crispy).',
            '3. **Salmon (cont):** Flip, cook flesh side 3 mins. Internal temp 50-55°C (medium-rare). Wrap in foil, rest 3 mins.',
            '4. **Spinach:** Heat 1 tbsp oil in same pan, sauté spinach 2 mins (wilted but green). Season.',
            '5. **Serve:** Bed of quinoa, spinach on top, salmon on top of that. Squeeze lots of lemon. Serve hot. Enjoy!'
        ]
    },
    {
        id: 'r5',
        title: 'Greek Yogurt Parfait',
        time: '5 min',
        calories: '320 kcal',
        protein: '28g',
        image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=800&q=80',
        description: 'Ideal for breakfast or snack. Probiotic + protein bomb.',
        timing: ['breakfast', 'snack'],
        difficulty: 'easy',
        caloriesNum: 320,
        proteinNum: 28,
        ingredients: [
            { id: '501', name: 'Greek Yogurt', quantity: '200g (1 bowl)', category: 'Protein' },
            { id: '502', name: 'Protein Granola', quantity: '30g (~3 tbsp)', category: 'Grain' },
            { id: '503', name: 'Blueberries (Fresh/Frozen)', quantity: '50g (1 handful)', category: 'Fruit' },
            { id: '504', name: 'Honey (Natural)', quantity: '1 tbsp (15g)', category: 'Sweetener' },
            { id: '505', name: 'Cinnamon (Optional)', quantity: '1 pinch', category: 'Spice' },
        ],
        steps: [
            '1. **Yogurt:** Place 200g Greek yogurt in a glass bowl, smooth surface.',
            '2. **Granola:** Sprinkle 30g granola evenly on top (spread to edges).',
            '3. **Fruit:** Scatter blueberries over granola. Thaw first if using frozen.',
            '4. **Honey:** Drizzle 1 tbsp honey in a zig-zag pattern for visuals.',
            '5. **Serve:** Serve cold. Sprinkle cinnamon if liked. Eat immediately (before granola gets soggy!).'
        ]
    },
    {
        id: 'r6',
        title: 'Meatballs & Sweet Potato',
        time: '30 min',
        calories: '580 kcal',
        protein: '42g',
        image: 'https://images.unsplash.com/photo-1529042410759-befb1204b468?auto=format&fit=crop&w=800&q=80',
        description: 'Perfect for bulking. High protein, complex carbs.',
        timing: ['lunch', 'dinner'],
        difficulty: 'medium',
        caloriesNum: 580,
        proteinNum: 42,
        ingredients: [
            { id: '601', name: 'Ground Beef (10% fat)', quantity: '200g', category: 'Protein' },
            { id: '602', name: 'Sweet Potato (Medium)', quantity: '1 whole (~200g)', category: 'Carbohydrate' },
            { id: '603', name: 'Onion (Medium)', quantity: '1 whole (~80g)', category: 'Vegetable' },
            { id: '604', name: 'Garlic', quantity: '2 cloves', category: 'Spice' },
            { id: '605', name: 'Cumin + Red Chili Flakes', quantity: '1 tsp mix', category: 'Spice' },
            { id: '606', name: 'Olive Oil', quantity: '1 tsp', category: 'Fat' },
        ],
        steps: [
            '1. **Mix:** Put ground beef in bowl. Add grated onion, crushed garlic, cumin, chili flakes, salt. Knead for 3-4 mins (binds protein). Chill 15 mins.',
            '2. **Potato:** Wash potato, dry, dice to 1.5cm cubes (skin on). Toss with 1 tsp oil. Bake at 200°C for 25-30 mins (stir occasionally until caramelized).',
            '3. **Meatballs:** Shape mix into medium balls (8-10 pieces, palm size). Don\'t pack too tight.',
            '4. **Cook:** Heat pan/grill to medium-high. Cook meatballs 3-4 mins per side until browned. Internal temp 70°C.',
            '5. **Serve:** Plate sweet potatoes, add meatballs. Serve with yogurt sauce. Enjoy hot!'
        ]
    },
    {
        id: 'r7',
        title: 'Protein Pancake',
        time: '15 min',
        calories: '380 kcal',
        protein: '35g',
        image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=800&q=80',
        description: 'Cheat meal that isn\'t a cheat. Satisfies sweet tooth, builds muscle.',
        timing: ['breakfast'],
        difficulty: 'medium',
        caloriesNum: 380,
        proteinNum: 35,
        ingredients: [
            { id: '701', name: 'Egg Whites', quantity: '4 whites (~120ml)', category: 'Protein' },
            { id: '702', name: 'Oat Flour', quantity: '50g (1/2 cup)', category: 'Grain' },
            { id: '703', name: 'Whey Protein (Vanilla)', quantity: '30g (1 scoop)', category: 'Supplement' },
            { id: '704', name: 'Banana (Ripe)', quantity: '1 medium', category: 'Fruit' },
            { id: '705', name: 'Baking Powder', quantity: '1 tsp', category: 'Additive' },
            { id: '706', name: 'Cooking Spray', quantity: '2-3 sprays', category: 'Fat' },
        ],
        steps: [
            '1. **Batter:** Blend egg whites, oat flour, protein powder, banana, baking powder for 30s. Add water if too thick.',
            '2. **Pan:** Heat non-stick pan on medium. Spray oil (or drop of olive oil). Lower heat to medium-low.',
            '3. **Cook:** Pour 1/2 ladle circles (10-12cm). Cook 2-3 mins until bubbles form on top.',
            '4. **Flip:** Carefully flip, cook 1.5-2 mins until golden.',
            '5. **Serve:** Stack on plate, top with banana slices/blueberries and honey. Serve hot!'
        ]
    },
    {
        id: 'r8',
        title: 'Grilled Turkey & Asparagus',
        time: '20 min',
        calories: '340 kcal',
        protein: '46g',
        image: 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=800&q=80',
        description: 'Perfect for cutting. Low calorie, maximum protein.',
        timing: ['lunch', 'dinner'],
        difficulty: 'easy',
        caloriesNum: 340,
        proteinNum: 46,
        ingredients: [
            { id: '801', name: 'Turkey Breast (Skinless)', quantity: '200g (~1 piece)', category: 'Protein' },
            { id: '802', name: 'Asparagus (Fresh)', quantity: '150g (~10-12 spears)', category: 'Vegetable' },
            { id: '803', name: 'Olive Oil', quantity: '1 tbsp', category: 'Fat' },
            { id: '804', name: 'Garlic (Fresh)', quantity: '2 cloves', category: 'Spice' },
            { id: '805', name: 'Lemon Juice', quantity: '1 tbsp', category: 'Acid' },
            { id: '806', name: 'Salt + Pepper', quantity: 'To taste', category: 'Spice' },
        ],
        steps: [
            '1. **Turkey:** Slice breast thin (~1cm), dry with paper towel. Marinate with crushed garlic, lemon, salt, pepper for 10 mins (chilled).',
            '2. **Asparagus:** Snap off woody ends. Toss with 1/2 tbsp olive oil and salt.',
            '3. **Grill Turkey:** Heat grill pan to high. Cook turkey 4-5 mins per side. Internal temp 74°C.',
            '4. **Grill Asparagus:** Add asparagus to same pan, cook 3-4 mins (turning often, keep crisp).',
            '5. **Serve:** Plate turkey, add asparagus, squeeze lemon over top. Serve hot!'
        ]
    },
    {
        id: 'r9',
        title: 'Tuna Salad',
        time: '10 min',
        calories: '280 kcal',
        protein: '32g',
        image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
        description: 'Quick, easy, effective. Ideal for lunch.',
        timing: ['lunch'],
        difficulty: 'easy',
        caloriesNum: 280,
        proteinNum: 32,
        ingredients: [
            { id: '901', name: 'Canned Tuna (in Oil)', quantity: '150g (1 can)', category: 'Protein' },
            { id: '902', name: 'Lettuce (Iceberg/Arugula)', quantity: '100g (1 handful)', category: 'Vegetable' },
            { id: '903', name: 'Tomato (Medium)', quantity: '1 whole (~100g)', category: 'Vegetable' },
            { id: '904', name: 'Olive Oil (Extra Virgin)', quantity: '2 tbsp', category: 'Fat' },
            { id: '905', name: 'Lemon Juice', quantity: '1 whole', category: 'Acid' },
            { id: '906', name: 'Salt + Pepper', quantity: 'To taste', category: 'Spice' },
        ],
        steps: [
            '1. **Lettuce:** Wash leaves thoroughly, dry, tear into pieces.',
            '2. **Tomato:** Dice into 1cm cubes.',
            '3. **Tuna:** Drain canned tuna (remove excess oil), flake into chunks in a large bowl.',
            '4. **Dressing:** Whisk olive oil and lemon juice in a small cup. Add salt & pepper.',
            '5. **Assemble:** Toss lettuce, tomato, tuna. Drizzle dressing, toss lightly. Serve immediately!'
        ]
    },
    {
        id: 'r10',
        title: 'Spinach Omelette',
        time: '12 min',
        calories: '300 kcal',
        protein: '26g',
        image: 'https://images.unsplash.com/photo-1608039829572-78524f79c4c7?auto=format&fit=crop&w=800&q=80',
        description: 'Classic breakfast hero. Full of iron and protein.',
        timing: ['breakfast'],
        difficulty: 'easy',
        caloriesNum: 300,
        proteinNum: 26,
        ingredients: [
            { id: '1001', name: 'Eggs (Large)', quantity: '3 pieces', category: 'Protein' },
            { id: '1002', name: 'Fresh Spinach', quantity: '100g (2 handfuls)', category: 'Vegetable' },
            { id: '1003', name: 'Ricotta Cheese', quantity: '50g (~2 tbsp)', category: 'Protein' },
            { id: '1004', name: 'Olive Oil', quantity: '1 tbsp', category: 'Fat' },
            { id: '1005', name: 'Salt + Pepper', quantity: 'To taste', category: 'Spice' },
        ],
        steps: [
            '1. **Egg:** Whisk 3 eggs in a bowl with a fork, add salt & pepper.',
            '2. **Spinach:** Heat olive oil in pan, sauté spinach 2 mins on medium (until wilted).',
            '3. **Omelette:** Pour eggs over spinach, cook on low heat 4-5 mins.',
            '4. **Fold:** When edges are set, fold in half with spatula.',
            '5. **Serve:** Slide onto plate, crumble ricotta on top. Serve hot!'
        ]
    },
    {
        id: 'r11',
        title: 'Steak & Cauliflower Mash',
        time: '25 min',
        calories: '520 kcal',
        protein: '48g',
        image: 'https://images.unsplash.com/photo-1588168333986-5078d3ae3976?auto=format&fit=crop&w=800&q=80',
        description: 'Premium protein source. Iron rich.',
        timing: ['lunch', 'dinner'],
        difficulty: 'medium',
        caloriesNum: 520,
        proteinNum: 48,
        ingredients: [
            { id: '1101', name: 'Steak (Tenderloin)', quantity: '180g (~1.5cm thick)', category: 'Protein' },
            { id: '1102', name: 'Cauliflower', quantity: '200g (~half head)', category: 'Vegetable' },
            { id: '1103', name: 'Butter', quantity: '1 tbsp', category: 'Fat' },
            { id: '1104', name: 'Rosemary (Fresh)', quantity: '1 sprig', category: 'Spice' },
            { id: '1105', name: 'Salt + Pepper', quantity: 'Generous amount', category: 'Spice' },
        ],
        steps: [
            '1. **Steak:** Bring to room temp (remove from fridge 30 mins prior). Rub generously with salt & pepper.',
            '2. **Cauliflower:** Break into florets, boil in salted water 10 mins (until soft). Drain.',
            '3. **Mash:** Blend boiled cauliflower with butter to a purée (creamy texture).',
            '4. **Grill:** Grill steak on high heat, 3-4 mins per side (medium-rare). Rest in foil 5 mins.',
            '5. **Serve:** Slice steak, place next to mash. Garnish with rosemary. Serve immediately!'
        ]
    },
    {
        id: 'r12',
        title: 'Peanut Butter Smoothie',
        time: '5 min',
        calories: '420 kcal',
        protein: '32g',
        image: 'https://images.unsplash.com/photo-1610970881699-44a5587cabec?auto=format&fit=crop&w=800&q=80',
        description: 'Pre-workout energy bomb. Delicious and filling.',
        timing: ['pre-workout', 'snack', 'breakfast'],
        difficulty: 'easy',
        caloriesNum: 420,
        proteinNum: 32,
        ingredients: [
            { id: '1201', name: 'Peanut Butter (Natural)', quantity: '2 tbsp (30g)', category: 'Fat' },
            { id: '1202', name: 'Whey Protein', quantity: '30g (1 scoop)', category: 'Supplement' },
            { id: '1203', name: 'Banana (Ripe)', quantity: '1 medium', category: 'Fruit' },
            { id: '1204', name: 'Almond Milk', quantity: '250ml (1 cup)', category: 'Dairy' },
            { id: '1205', name: 'Ice (Optional)', quantity: '3-4 cubes', category: 'Additive' },
        ],
        steps: [
            '1. Blend peanut butter, protein powder, banana, and almond milk for 30 seconds.',
            '2. If too thick, add 50ml more milk.',
            '3. Blend on high for 1 minute until smooth.',
            '4. Pour into glass, add ice if desired.',
            '5. Serve cold, drink 30 mins before workout.'
        ]
    },
    {
        id: 'r13',
        title: 'Shrimp & Zucchini Noodles',
        time: '15 min',
        calories: '290 kcal',
        protein: '36g',
        image: 'https://images.unsplash.com/photo-1551248429-40975aa4de74?auto=format&fit=crop&w=800&q=80',
        description: 'Low-carb miracle. High protein, minimum calories.',
        timing: ['lunch', 'dinner'],
        difficulty: 'medium',
        caloriesNum: 290,
        proteinNum: 36,
        ingredients: [
            { id: '1301', name: 'Shrimp (Cleaned)', quantity: '200g (~12-15 pieces)', category: 'Protein' },
            { id: '1302', name: 'Zucchini', quantity: '2 medium', category: 'Vegetable' },
            { id: '1303', name: 'Garlic', quantity: '3 cloves (crushed)', category: 'Spice' },
            { id: '1304', name: 'Olive Oil', quantity: '1 tbsp', category: 'Fat' },
            { id: '1305', name: 'Lemon + Salt', quantity: 'To taste', category: 'Spice' },
        ],
        steps: [
            '1. Cut zucchini into noodles with spiralizer (or slice thin).',
            '2. Peel and clean shrimp, marinate with garlic.',
            '3. Heat olive oil in pan, sauté shrimp 2-3 mins on medium-high until pink.',
            '4. Add zucchini noodles, toss and cook for 1-2 mins.',
            '5. Remove from heat, season with salt, pepper, lemon. Serve immediately.'
        ]
    },
    {
        id: 'r14',
        title: 'Cottage Cheese Bowl',
        time: '3 min',
        calories: '260 kcal',
        protein: '30g',
        image: 'https://images.unsplash.com/photo-1505576399279-565b52d4ac71?auto=format&fit=crop&w=800&q=80',
        description: 'Perfect pre-bed snack. Slow-digesting protein.',
        timing: ['snack', 'pre-bed'],
        difficulty: 'easy',
        caloriesNum: 260,
        proteinNum: 30,
        ingredients: [
            { id: '1401', name: 'Cottage Cheese (2% fat)', quantity: '200g (1 bowl)', category: 'Protein' },
            { id: '1402', name: 'Strawberries (Fresh)', quantity: '50g (~5-6 berries)', category: 'Fruit' },
            { id: '1403', name: 'Chia Seeds', quantity: '1 tbsp', category: 'Seed' },
            { id: '1404', name: 'Cinnamon', quantity: '1 pinch', category: 'Spice' },
        ],
        steps: [
            '1. Place cottage cheese in a bowl.',
            '2. Wash and slice strawberries, place on top.',
            '3. Sprinkle chia seeds over fruit.',
            '4. Dust lightly with cinnamon.',
            '5. Serve cold. Eat 1 hour before bed.'
        ]
    },
    {
        id: 'r15',
        title: 'Bulgur Pilaf & Chickpeas',
        time: '25 min',
        calories: '450 kcal',
        protein: '18g',
        image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=800&q=80',
        description: 'Vegetarian protein powerhouse. Full of fiber and energy.',
        timing: ['lunch', 'dinner'],
        difficulty: 'medium',
        caloriesNum: 450,
        proteinNum: 18,
        ingredients: [
            { id: '1501', name: 'Bulgur (Coarse)', quantity: '100g (1/2 cup)', category: 'Grain' },
            { id: '1502', name: 'Chickpeas (Boiled)', quantity: '100g (~1/2 cup)', category: 'Legume' },
            { id: '1503', name: 'Tomato Paste', quantity: '1 tbsp', category: 'Sauce' },
            { id: '1504', name: 'Onion (Medium)', quantity: '1 whole', category: 'Vegetable' },
            { id: '1505', name: 'Olive Oil + Salt', quantity: 'To taste', category: 'Fat' },
        ],
        steps: [
            '1. Finely chop onion, sauté in olive oil for 3-4 mins until pink.',
            '2. Add tomato paste, sauté for 1 more min.',
            '3. Add bulgur and boiled chickpeas, mix well.',
            '4. Add 2 cups hot water, salt, cover lid.',
            '5. Simmer on low for 15 mins until water absorbed. Rest and serve.'
        ]
    },
    {
        id: 'r16',
        title: 'Grilled Meatball Wrap',
        time: '20 min',
        calories: '510 kcal',
        protein: '40g',
        image: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=800&q=80',
        description: 'Portable protein source. Ideal for eating out.',
        timing: ['lunch'],
        difficulty: 'easy',
        caloriesNum: 510,
        proteinNum: 40,
        ingredients: [
            { id: '1601', name: 'Ground Beef', quantity: '150g', category: 'Protein' },
            { id: '1602', name: 'Whole Wheat Tortilla', quantity: '1 piece', category: 'Carbohydrate' },
            { id: '1603', name: 'Lettuce', quantity: '50g', category: 'Vegetable' },
            { id: '1604', name: 'Tomato', quantity: '1 whole', category: 'Vegetable' },
            { id: '1605', name: 'Yogurt Sauce', quantity: '2 tsp', category: 'Sauce' },
        ],
        steps: [
            '1. Knead beef with salt, pepper, shape into small meatballs (5-6 pieces).',
            '2. Cook meatballs in pan or grill for 3 mins per side.',
            '3. Warm tortilla in pan for 30s each side.',
            '4. Place lettuce and tomato on tortilla.',
            '5. Add meatballs, drizzle sauce, wrap tight. Serve cut in half.'
        ]
    },
    {
        id: 'r17',
        title: 'Protein Balls',
        time: '10 min',
        calories: '220 kcal',
        protein: '15g',
        image: 'https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?auto=format&fit=crop&w=800&q=80',
        description: 'Snacking champion. Energy and protein in one bite.',
        timing: ['snack', 'pre-workout'],
        difficulty: 'easy',
        caloriesNum: 220,
        proteinNum: 15,
        ingredients: [
            { id: '1701', name: 'Oats', quantity: '50g', category: 'Grain' },
            { id: '1702', name: 'Peanut Butter', quantity: '2 tsp', category: 'Fat' },
            { id: '1703', name: 'Honey', quantity: '1 tsp', category: 'Sweetener' },
            { id: '1704', name: 'Protein Powder', quantity: '1/2 scoop', category: 'Supplement' },
            { id: '1705', name: 'Dark Chocolate', quantity: '20g', category: 'Sweetener' },
        ],
        steps: [
            '1. Mix oats, peanut butter, honey, protein powder, chocolate in deep bowl.',
            '2. Knead with hands (sticky texture). Add 1 tsp water if dry.',
            '3. Shape into walnut-sized balls (10-12 pieces).',
            '4. Place on cling film, chill in fridge for 2 hours.',
            '5. Serve. Lasts 1 week in airtight container.'
        ]
    },
    {
        id: 'r18',
        title: 'Grilled Sea Bass & Greens',
        time: '20 min',
        calories: '320 kcal',
        protein: '38g',
        image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=800&q=80',
        description: 'Omega-3 and light protein. Ideal for dinner.',
        timing: ['dinner'],
        difficulty: 'medium',
        caloriesNum: 320,
        proteinNum: 38,
        ingredients: [
            { id: '1801', name: 'Sea Bass (Levrek)', quantity: '200g', category: 'Protein' },
            { id: '1802', name: 'Arugula', quantity: '100g', category: 'Vegetable' },
            { id: '1803', name: 'Lemon', quantity: '1 whole', category: 'Spice' },
            { id: '1804', name: 'Olive Oil', quantity: '1 tsp', category: 'Fat' },
        ],
        steps: [
            '1. Clean fish, rub both sides with salt & pepper, rest 10 mins.',
            '2. Heat grill to high, cook fish 5-6 mins per side.',
            '3. Prepare arugula in a bowl, toss with olive oil and lemon juice.',
            '4. Place arugula salad on plate.',
            '5. Place grilled sea bass on top, garnish with lemon slice. Serve hot.'
        ]
    },
    {
        id: 'r19',
        title: 'Lentil Soup',
        time: '30 min',
        calories: '380 kcal',
        protein: '22g',
        image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=800&q=80',
        description: 'Classic protein source. Filling and warming.',
        timing: ['lunch', 'dinner'],
        difficulty: 'medium',
        caloriesNum: 380,
        proteinNum: 22,
        ingredients: [
            { id: '1901', name: 'Red Lentils', quantity: '150g', category: 'Legume' },
            { id: '1902', name: 'Onion', quantity: '1 whole', category: 'Vegetable' },
            { id: '1903', name: 'Carrot', quantity: '1 whole', category: 'Vegetable' },
            { id: '1904', name: 'Butter', quantity: '1 tsp', category: 'Fat' },
            { id: '1905', name: 'Lemon', quantity: '1 whole', category: 'Spice' },
        ],
        steps: [
            '1. Wash lentils, boil with 3 cups water for 15 mins.',
            '2. Finely chop onion and carrot, sauté in butter for 5 mins.',
            '3. Add cooked lentils to sautéed veggies, boil for 5 mins more.',
            '4. Blend until smooth. Season with salt.',
            '5. Pour into bowl, garnish with lemon. Serve hot.'
        ]
    },
    {
        id: 'r20',
        title: 'Chia Pudding',
        time: '5 min + 4 hrs',
        calories: '280 kcal',
        protein: '18g',
        image: 'https://images.unsplash.com/photo-1623428187969-5da2dcea5ebf?auto=format&fit=crop&w=800&q=80',
        description: 'Prep ahead for morning. Full of Omega-3 and fiber.',
        timing: ['breakfast', 'snack'],
        difficulty: 'easy',
        caloriesNum: 280,
        proteinNum: 18,
        ingredients: [
            { id: '2001', name: 'Chia Seeds', quantity: '3 tbsp', category: 'Seed' },
            { id: '2002', name: 'Almond Milk', quantity: '200ml', category: 'Dairy' },
            { id: '2003', name: 'Vanilla Extract', quantity: '1 drop', category: 'Spice' },
            { id: '2004', name: 'Blueberries', quantity: '50g', category: 'Fruit' },
            { id: '2005', name: 'Honey', quantity: '1 tsp', category: 'Sweetener' },
        ],
        steps: [
            '1. Place chia seeds in a jar/bowl.',
            '2. Add almond milk and vanilla, stir well (all seeds submerged).',
            '3. Cover and chill in fridge for 4 hours (or overnight).',
            '4. Stir again when jelly-like consistency reached.',
            '5. Top with blueberries and honey. Serve cold.'
        ]
    },
    {
        id: 'r21',
        title: 'Chicken Shish & Bulgur',
        time: '35 min',
        calories: '530 kcal',
        protein: '44g',
        image: 'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?auto=format&fit=crop&w=800&q=80',
        description: 'Classic protein plate. Filling and delicious.',
        timing: ['lunch', 'dinner', 'post-workout'],
        difficulty: 'medium',
        caloriesNum: 530,
        proteinNum: 44,
        ingredients: [
            { id: '2101', name: 'Chicken Breast', quantity: '200g', category: 'Protein' },
            { id: '2102', name: 'Bulgur Pilaf', quantity: '100g', category: 'Grain' },
            { id: '2103', name: 'Pepper (Green/Red)', quantity: '1 whole', category: 'Vegetable' },
            { id: '2104', name: 'Yogurt', quantity: '100g', category: 'Dairy' },
        ],
        steps: [
            '1. Cube chicken, marinate with yogurt, salt, cumin for 30 mins.',
            '2. Skewer chicken cubes alternating with pepper chunks.',
            '3. Grill on high heat for 4-5 mins each side.',
            '4. Boil bulgur (15 mins on low).',
            '5. Plate pilaf, place shish on side, serve with yogurt.'
        ]
    },
    {
        id: 'r22',
        title: 'Protein Waffle',
        time: '15 min',
        calories: '390 kcal',
        protein: '33g',
        image: 'https://images.unsplash.com/photo-1558584724-0e4d32ca09a4?auto=format&fit=crop&w=800&q=80',
        description: 'Weekend breakfast. Cheat meal taste, clean macros.',
        timing: ['breakfast'],
        difficulty: 'medium',
        caloriesNum: 390,
        proteinNum: 33,
        ingredients: [
            { id: '2201', name: 'Oat Flour', quantity: '60g', category: 'Grain' },
            { id: '2202', name: 'Whey Protein', quantity: '1 scoop', category: 'Supplement' },
            { id: '2203', name: 'Eggs', quantity: '2 pieces', category: 'Protein' },
            { id: '2204', name: 'Cinnamon', quantity: '1 tsp', category: 'Spice' },
            { id: '2205', name: 'Fruit', quantity: '100g', category: 'Fruit' },
        ],
        steps: [
            '1. Mix oat flour, protein powder, eggs and cinnamon in a bowl.',
            '2. Add 50ml water if too thick, whisk to smooth batter.',
            '3. Heat waffle iron, grease lightly.',
            '4. Pour one ladle of batter, close lid, cook 4-5 mins.',
            '5. Remove, top with fruit, add honey/syrup if desired.'
        ]
    },
    {
        id: 'r23',
        title: 'Banana Protein Shake',
        time: '3 min',
        calories: '380 kcal',
        protein: '28g',
        image: 'https://images.unsplash.com/photo-1505252585461-04db1eb84625?auto=format&fit=crop&w=800&q=80',
        description: 'Post-workout bomb. Ready instantly!',
        timing: ['post-workout', 'snack', 'breakfast'],
        difficulty: 'easy',
        caloriesNum: 380,
        proteinNum: 28,
        ingredients: [
            { id: '2301', name: 'Milk', quantity: '300ml', category: 'Dairy' },
            { id: '2302', name: 'Banana', quantity: '2 pieces', category: 'Fruit' },
            { id: '2303', name: 'Whey Protein', quantity: '1 scoop', category: 'Supplement' },
            { id: '2304', name: 'Oats', quantity: '2 tbsp', category: 'Grain' },
            { id: '2305', name: 'Hazelnut Butter', quantity: '1 tsp', category: 'Fat' },
        ],
        steps: [
            '1. Blend milk, banana, protein powder, oats, hazelnut butter for 30 secs.',
            '2. Add ice, blend 15 secs more for cold/creamy texture.',
            '3. Add 50ml milk if too thick.',
            '4. Pour into glass, top with banana slice.',
            '5. Drink immediately within 30 mins post-workout!'
        ]
    },
    {
        id: 'r24',
        title: 'Overnight Oats',
        time: '5 min + overnight',
        calories: '340 kcal',
        protein: '22g',
        image: 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?auto=format&fit=crop&w=800&q=80',
        description: 'Prep at night, eat in morning. Milky protein start.',
        timing: ['breakfast'],
        difficulty: 'easy',
        caloriesNum: 340,
        proteinNum: 22,
        ingredients: [
            { id: '2401', name: 'Oats', quantity: '60g', category: 'Grain' },
            { id: '2402', name: 'Milk', quantity: '200ml', category: 'Dairy' },
            { id: '2403', name: 'Protein Powder', quantity: '1/2 scoop', category: 'Supplement' },
            { id: '2404', name: 'Banana', quantity: '1 piece', category: 'Fruit' },
            { id: '2405', name: 'Cinnamon', quantity: '1 pinch', category: 'Spice' },
        ],
        steps: [
            '1. Put oats, milk, protein powder, cinnamon in a jar.',
            '2. Mash banana and add, mix thoroughly.',
            '3. Close lid, refrigerate overnight (min 4 hours).',
            '4. Remove from jar in morning, top with fresh banana.',
            '5. Serve cold, perfect with coffee!'
        ]
    },
    {
        id: 'r25',
        title: 'Banana Oat Cookies',
        time: '25 min',
        calories: '180 kcal',
        protein: '12g',
        image: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=800&q=80',
        description: 'Healthy snack. No sugar, just banana and oats!',
        timing: ['snack', 'pre-workout'],
        difficulty: 'easy',
        caloriesNum: 180,
        proteinNum: 12,
        ingredients: [
            { id: '2501', name: 'Oats', quantity: '100g', category: 'Grain' },
            { id: '2502', name: 'Muz (Mashed)', quantity: '2 pieces', category: 'Fruit' },
            { id: '2503', name: 'Protein Powder', quantity: '2 scoops', category: 'Supplement' },
            { id: '2504', name: 'Peanut Butter', quantity: '1 tsp', category: 'Fat' },
            { id: '2505', name: 'Cinnamon', quantity: '1 tsp', category: 'Spice' },
        ],
        steps: [
            '1. Heat oven to 180°C, line tray with paper.',
            '2. Mix mashed banana, oats, protein powder, peanut butter, cinnamon.',
            '3. Knead by hand to sticky dough.',
            '4. Form small balls, press gently on tray.',
            '5. Bake 12-15 mins until edges brown. Cool and serve!'
        ]
    },
    {
        id: 'r26',
        title: 'Grilled Halloumi & Veg',
        time: '15 min',
        calories: '420 kcal',
        protein: '34g',
        image: 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=800&q=80',
        description: 'Vegetarian protein bomb. For grilled cheese lovers!',
        timing: ['lunch', 'dinner'],
        difficulty: 'easy',
        caloriesNum: 420,
        proteinNum: 34,
        ingredients: [
            { id: '2601', name: 'Halloumi Cheese', quantity: '200g', category: 'Protein' },
            { id: '2602', name: 'Eggplant', quantity: '1 piece', category: 'Vegetable' },
            { id: '2603', name: 'Pepper', quantity: '2 pieces', category: 'Vegetable' },
            { id: '2604', name: 'Olive Oil', quantity: '1 tsp', category: 'Fat' },
            { id: '2605', name: 'Thyme', quantity: '1 pinch', category: 'Spice' },
        ],
        steps: [
            '1. Slice halloumi (1cm), cut eggplant and pepper lengthwise.',
            '2. Brush veggies with oil, sprinkle salt & thyme.',
            '3. Heat grill to high, cook veggies 4-5 mins each side.',
            '4. Add halloumi to grill, cook 2-3 mins/side (golden brown).',
            '5. Plate together, serve with lemon.'
        ]
    },
    {
        id: 'r27',
        title: 'Protein Granola Bars',
        time: '30 min',
        calories: '240 kcal',
        protein: '18g',
        image: 'https://images.unsplash.com/photo-1526234362653-3b75a0c07438?auto=format&fit=crop&w=800&q=80',
        description: 'Homemade protein bar. Milk powder and oat mix!',
        timing: ['snack', 'pre-workout'],
        difficulty: 'medium',
        caloriesNum: 240,
        proteinNum: 18,
        ingredients: [
            { id: '2701', name: 'Oats', quantity: '150g', category: 'Grain' },
            { id: '2702', name: 'Milk Powder', quantity: '50g', category: 'Dairy' },
            { id: '2703', name: 'Honey', quantity: '3 tsp', category: 'Sweetener' },
            { id: '2704', name: 'Peanut Butter', quantity: '3 tsp', category: 'Fat' },
            { id: '2705', name: 'Protein Powder', quantity: '2 tsp', category: 'Supplement' },
        ],
        steps: [
            '1. Melt honey and peanut butter in pan on low heat (2 mins).',
            '2. Mix oats, milk powder, protein powder in separate bowl.',
            '3. Pour liquid into dry mix, knead well by hand.',
            '4. Press into rectangular mold, chill 2 hours.',
            '5. Cut into bars. Keeps 1 week in container!'
        ]
    },
    {
        id: 'r28',
        title: 'Banana Protein Muffins',
        time: '30 min',
        calories: '210 kcal',
        protein: '14g',
        image: 'https://images.unsplash.com/photo-1607958996333-41aef7caefaa?auto=format&fit=crop&w=800&q=80',
        description: 'Banana muffins but healthy. Perfect with coffee!',
        timing: ['breakfast', 'snack'],
        difficulty: 'medium',
        caloriesNum: 210,
        proteinNum: 14,
        ingredients: [
            { id: '2801', name: 'Oat Flour', quantity: '100g', category: 'Grain' },
            { id: '2802', name: 'Banana (Mashed)', quantity: '3 pieces', category: 'Fruit' },
            { id: '2803', name: 'Eggs', quantity: '2 pieces', category: 'Protein' },
            { id: '2804', name: 'Protein Powder', quantity: '2 tsp', category: 'Supplement' },
            { id: '2805', name: 'Milk', quantity: '50ml', category: 'Dairy' },
        ],
        steps: [
            '1. Heat oven to 180°C, line muffin tin.',
            '2. Mix mashed banana, eggs, milk, protein powder.',
            '3. Add oat flour, mix to smooth batter.',
            '4. Fill molds 3/4 full, top with banana slice.',
            '5. Bake 18-20 mins until toothpick comes clean. Cool and eat!'
        ]
    },
    {
        id: 'r29',
        title: 'Grilled Veggie Cheese Wrap',
        time: '20 min',
        calories: '450 kcal',
        protein: '26g',
        image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80',
        description: 'Grilled veggie + cheese = portable meal!',
        timing: ['lunch'],
        difficulty: 'easy',
        caloriesNum: 450,
        proteinNum: 26,
        ingredients: [
            { id: '2901', name: 'Whole Wheat Tortilla', quantity: '1 piece', category: 'Carbohydrate' },
            { id: '2902', name: 'Zucchini', quantity: '1 piece', category: 'Vegetable' },
            { id: '2903', name: 'Pepper', quantity: '1 piece', category: 'Vegetable' },
            { id: '2904', name: 'Feta Cheese', quantity: '100g', category: 'Protein' },
            { id: '2905', name: 'Olive Oil', quantity: '1 tsp', category: 'Fat' },
        ],
        steps: [
            '1. Slice zucchini and pepper, brush with oil.',
            '2. Grill vegetables 3-4 mins until soft.',
            '3. Warm tortilla in pan 30 secs each side.',
            '4. Place grilled veggies and crumbled cheese on tortilla.',
            '5. Wrap tight, cut in half, serve immediately!'
        ]
    },
    {
        id: 'r30',
        title: 'Milk Cocoa Protein Drink',
        time: '5 min',
        calories: '320 kcal',
        protein: '30g',
        image: 'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?auto=format&fit=crop&w=800&q=80',
        description: 'Chocolate milk but protein packed. Ideal pre-bed!',
        timing: ['snack', 'pre-bed'],
        difficulty: 'easy',
        caloriesNum: 320,
        proteinNum: 30,
        ingredients: [
            { id: '3001', name: 'Milk', quantity: '300ml', category: 'Dairy' },
            { id: '3002', name: 'Cocoa Powder', quantity: '1 tsp', category: 'Sweetener' },
            { id: '3003', name: 'Whey Protein (Chocolate)', quantity: '1 scoop', category: 'Supplement' },
            { id: '3004', name: 'Banana', quantity: 'Half', category: 'Fruit' },
            { id: '3005', name: 'Cinnamon', quantity: '1 pinch', category: 'Spice' },
        ],
        steps: [
            '1. Blend milk, cocoa, protein powder, banana for 20 seconds.',
            '2. Add cinnamon, blend 10 more seconds.',
            '3. Pour into glass, sprinkle cocoa on top (optional).',
            '4. Add ice if you want it cold.',
            '5. Drink 1 hour before bed, ideal for slow-digesting protein!'
        ]
    },
    {
        id: 'r31',
        title: 'Boiled Eggs (Perfect)',
        time: '10 min',
        calories: '140 kcal',
        protein: '12g',
        image: 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=800&q=80',
        description: 'Soft or hard boiled. Basic but perfect technique!',
        timing: ['breakfast', 'snack', 'post-workout'],
        difficulty: 'easy',
        caloriesNum: 140,
        proteinNum: 12,
        ingredients: [
            { id: '3101', name: 'Eggs', quantity: '2 pieces', category: 'Protein' },
            { id: '3102', name: 'Salt', quantity: '1 pinch', category: 'Spice' },
        ],
        steps: [
            '1. Bring eggs to room temp (leave out 5 mins).',
            '2. Boil water in pot.',
            '3. Gently lower eggs into water, start timer.',
            '4. **Soft boiled:** 6 mins. **Medium:** 8 mins. **Hard boiled:** 10 mins.',
            '5. Move to ice water immediately when done, wait 2 mins. Easy to peel!'
        ]
    },
    {
        id: 'r32',
        title: 'Scrambled Eggs',
        time: '5 min',
        calories: '220 kcal',
        protein: '18g',
        image: 'https://images.unsplash.com/photo-1494390248081-4e521a5940db?auto=format&fit=crop&w=800&q=80',
        description: 'Creamy, soft scrambled eggs. Restaurant quality!',
        timing: ['breakfast'],
        difficulty: 'easy',
        caloriesNum: 220,
        proteinNum: 18,
        ingredients: [
            { id: '3201', name: 'Eggs', quantity: '3 pieces', category: 'Protein' },
            { id: '3202', name: 'Milk', quantity: '2 tsp', category: 'Dairy' },
            { id: '3203', name: 'Butter', quantity: '1 knob', category: 'Fat' },
            { id: '3204', name: 'Salt & Pepper', quantity: 'To taste', category: 'Spice' },
        ],
        steps: [
            '1. Whisk eggs in a bowl, add milk, salt & pepper.',
            '2. Heat pan on medium, melt butter to coat.',
            '3. Pour egg mix, wait 10 seconds.',
            '4. Stir gently with wooden spoon, on-off heat technique (keep creamy).',
            '5. Plate while slightly moist, residual heat finishes cooking. Add avocado/tomato on side!'
        ]
    },
    {
        id: 'r33',
        title: 'Protein Omelette (Veggie)',
        time: '8 min',
        calories: '280 kcal',
        protein: '28g',
        image: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?auto=format&fit=crop&w=800&q=80',
        description: 'Veggie, cheese, high protein omelette. Filling!',
        timing: ['breakfast', 'lunch', 'dinner'],
        difficulty: 'easy',
        caloriesNum: 280,
        proteinNum: 28,
        ingredients: [
            { id: '3301', name: 'Eggs', quantity: '3 pieces', category: 'Protein' },
            { id: '3302', name: 'Feta Cheese', quantity: '30g', category: 'Dairy' },
            { id: '3303', name: 'Tomato', quantity: 'Half', category: 'Vegetable' },
            { id: '3304', name: 'Green Pepper', quantity: 'Half', category: 'Vegetable' },
            { id: '3305', name: 'Olive Oil', quantity: '1 tsp', category: 'Fat' },
        ],
        steps: [
            '1. Dice tomato and pepper.',
            '2. Whisk eggs, add salt & pepper.',
            '3. Heat olive oil in pan, sauté veggies 2 mins.',
            '4. Pour eggs, sprinkle crumbled cheese on top.',
            '5. Fold in half when bottom sets, wait 1 min more. Serve!'
        ]
    },
    {
        id: 'r34',
        title: 'Grilled Oat Pancake',
        time: '15 min',
        calories: '320 kcal',
        protein: '22g',
        image: 'https://images.unsplash.com/photo-1506084868230-bb9d95c24759?auto=format&fit=crop&w=800&q=80',
        description: 'Protein pancake cooked on grill or pan. Ideal for morning!',
        timing: ['breakfast', 'snack'],
        difficulty: 'medium',
        caloriesNum: 320,
        proteinNum: 22,
        ingredients: [
            { id: '3401', name: 'Oats', quantity: '50g', category: 'Grain' },
            { id: '3402', name: 'Eggs', quantity: '2 pieces', category: 'Protein' },
            { id: '3403', name: 'Protein Powder', quantity: '1/2 scoop', category: 'Supplement' },
            { id: '3404', name: 'Banana', quantity: '1 piece (mashed)', category: 'Fruit' },
            { id: '3405', name: 'Baking Powder', quantity: '1/2 tsp', category: 'Additive' },
        ],
        steps: [
            '1. Blend oats, eggs, banana, protein powder, baking powder.',
            '2. Mix until batter consistency (add 1-2 tsp water if too thick).',
            '3. Heat pan or grill on medium, lightly grease.',
            '4. Pour batter with ladle, wait 2-3 mins (flip when bubbles appear).',
            '5. Cook other side 2 mins. Top with honey or peanut butter!'
        ]
    },
    {
        id: 'r35',
        title: 'Protein Waffle (Waffle Maker)',
        time: '10 min',
        calories: '350 kcal',
        protein: '26g',
        image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80',
        description: 'Crispy protein waffle in waffle maker. Morning delight!',
        timing: ['breakfast', 'snack'],
        difficulty: 'easy',
        caloriesNum: 350,
        proteinNum: 26,
        ingredients: [
            { id: '3501', name: 'Oat Flour', quantity: '60g', category: 'Grain' },
            { id: '3502', name: 'Eggs', quantity: '2 pieces', category: 'Protein' },
            { id: '3503', name: 'Protein Powder (Vanilla)', quantity: '1 scoop', category: 'Supplement' },
            { id: '3504', name: 'Milk', quantity: '100ml', category: 'Dairy' },
            { id: '3505', name: 'Baking Powder', quantity: '1 tsp', category: 'Additive' },
        ],
        steps: [
            '1. Mix all ingredients, get smooth batter.',
            '2. Preheat waffle maker (medium-high).',
            '3. Lightly grease machine (spray oil ideal).',
            '4. Pour batter in center, close lid, cook 4-5 mins (until golden).',
            '5. Remove, add fruit, honey or Greek yogurt. Enjoy!'
        ]
    },
    {
        id: 'r36',
        title: 'Power Protein Salad',
        time: '10 min',
        calories: '320 kcal',
        protein: '28g',
        image: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=800&q=80',
        description: 'Light but filling. Vitamin + protein bomb.',
        timing: ['lunch', 'dinner'],
        difficulty: 'easy',
        caloriesNum: 320,
        proteinNum: 28,
        ingredients: [
            { id: '3601', name: 'Chicken Breast (Boiled)', quantity: '150g', category: 'Protein' },
            { id: '3602', name: 'Lettuce (Iceberg)', quantity: '100g', category: 'Vegetable' },
            { id: '3603', name: 'Tomato', quantity: '1 piece', category: 'Vegetable' },
            { id: '3604', name: 'Cucumber', quantity: '1 piece', category: 'Vegetable' },
            { id: '3605', name: 'Olive Oil', quantity: '1 tbsp', category: 'Fat' },
            { id: '3606', name: 'Lemon', quantity: '1 piece (juice)', category: 'Acid' },
        ],
        steps: [
            '1. **Chicken:** Dice boiled chicken breast.',
            '2. **Veggie:** Wash lettuce, tomato, cucumber, chop into small pieces.',
            '3. **Mix:** Combine all ingredients in a large bowl.',
            '4. **Dressing:** Mix olive oil, lemon juice, salt, pepper, drizzle over salad.',
            '5. **Serve:** Consume fresh! Whole wheat bread on side optional.'
        ]
    },
];

// --- FOOD DATABASE (for Daily Log auto-suggest) ---
const FOOD_DATABASE = [
    // Common Proteins
    { name: 'Chicken Breast (100g)', calories: 165, protein: 31, carbs: 0, fat: 3.6 },
    { name: 'Ground Beef (100g)', calories: 250, protein: 26, carbs: 0, fat: 17 },
    { name: 'Grilled Salmon (100g)', calories: 206, protein: 22, carbs: 0, fat: 13 },
    { name: 'Canned Tuna (100g)', calories: 116, protein: 26, carbs: 0, fat: 1 },
    { name: 'Egg (1 large)', calories: 78, protein: 6.3, carbs: 0.6, fat: 5.3 },
    { name: 'Turkey Breast (100g)', calories: 135, protein: 30, carbs: 0, fat: 1 },
    { name: 'Meatball (1 ~50g)', calories: 125, protein: 10, carbs: 2, fat: 8.5 },
    { name: 'Shrimp (100g)', calories: 99, protein: 24, carbs: 0, fat: 0.3 },

    // Dairy
    { name: 'Greek Yogurt (100g)', calories: 59, protein: 10, carbs: 3.6, fat: 0.4 },
    { name: 'Milk (200ml)', calories: 122, protein: 6.6, carbs: 9.4, fat: 7 },
    { name: 'Ricotta Cheese (50g)', calories: 81, protein: 8, carbs: 3, fat: 4 },
    { name: 'Cottage Cheese (100g)', calories: 98, protein: 11, carbs: 3.4, fat: 4 },
    { name: 'Feta Cheese (30g)', calories: 75, protein: 5, carbs: 1, fat: 6 },

    // Carbs
    { name: 'White Rice (100g)', calories: 130, protein: 2.7, carbs: 28, fat: 0.3 },
    { name: 'Bulgur (100g)', calories: 83, protein: 3, carbs: 18, fat: 0.2 },
    { name: 'Pasta (100g)', calories: 131, protein: 5, carbs: 25, fat: 1.1 },
    { name: 'Whole Wheat Bread (1 slice)', calories: 69, protein: 3.5, carbs: 11.6, fat: 1.2 },
    { name: 'Whole Grain Bread (1 slice)', calories: 81, protein: 4, carbs: 13.8, fat: 1.1 },
    { name: 'Oatmeal (50g dry)', calories: 190, protein: 6.5, carbs: 34, fat: 3.5 },
    { name: 'Sweet Potato (100g)', calories: 112, protein: 1.6, carbs: 26, fat: 0 },
    { name: 'Quinoa (100g cooked)', calories: 120, protein: 4.4, carbs: 21, fat: 1.9 },

    // Vegetables
    { name: 'Broccoli (100g)', calories: 34, protein: 2.8, carbs: 7, fat: 0.4 },
    { name: 'Spinach (100g)', calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4 },
    { name: 'Cauliflower (100g)', calories: 25, protein: 1.9, carbs: 5, fat: 0.3 },
    { name: 'Tomato (1 medium)', calories: 22, protein: 1.1, carbs: 4.8, fat: 0.2 },
    { name: 'Cucumber (100g)', calories: 15, protein: 0.7, carbs: 3.6, fat: 0.1 },
    { name: 'Lettuce (100g)', calories: 15, protein: 1.4, carbs: 2.9, fat: 0.2 },
    { name: 'Asparagus (100g)', calories: 20, protein: 2.2, carbs: 3.9, fat: 0.1 },

    // Fruits
    { name: 'Banana (1 medium)', calories: 105, protein: 1.3, carbs: 27, fat: 0.4 },
    { name: 'Apple (1 medium)', calories: 95, protein: 0.5, carbs: 25, fat: 0.3 },
    { name: 'Blueberries (100g)', calories: 57, protein: 0.7, carbs: 14, fat: 0.3 },
    { name: 'Strawberries (100g)', calories: 32, protein: 0.7, carbs: 7.7, fat: 0.3 },
    { name: 'Avocado (100g)', calories: 160, protein: 2, carbs: 8.5, fat: 15 },

    // Nuts & Seeds
    { name: 'Almonds (30g)', calories: 170, protein: 6, carbs: 6, fat: 15 },
    { name: 'Walnuts (30g)', calories: 185, protein: 4.3, carbs: 3.9, fat: 18.5 },
    { name: 'Peanut Butter (1 tbsp)', calories: 94, protein: 4, carbs: 3.5, fat: 8 },
    { name: 'Chia Seeds (1 tbsp)', calories: 58, protein: 2, carbs: 5, fat: 3.7 },

    // Other
    { name: 'Whey Protein (1 scoop)', calories: 120, protein: 24, carbs: 3, fat: 1.5 },
    { name: 'Olive Oil (1 tbsp)', calories: 119, protein: 0, carbs: 0, fat: 13.5 },
    { name: 'Honey (1 tbsp)', calories: 64, protein: 0.1, carbs: 17, fat: 0 },
    { name: 'Granola (30g)', calories: 140, protein: 3, carbs: 19, fat: 6 },

    // From Recipes (auto-generated)
    ...RECIPES.map(r => ({
        name: r.title,
        calories: r.caloriesNum,
        protein: r.proteinNum,
        carbs: Math.round((r.caloriesNum - (r.proteinNum * 4 + r.caloriesNum * 0.25)) / 4), // estimate
        fat: Math.round(r.caloriesNum * 0.25 / 9), // estimate 25% from fat
        source: 'recipe'
    }))
];

const AppContext = createContext();

const AppProvider = ({ children }) => {
    const [groceryList, setGroceryList] = useState([]);
    const [userProfile, setUserProfile] = useState(null);
    const [dailyLog, setDailyLog] = useState({ date: new Date().toISOString().split('T')[0], eaten: [], workoutDuration: 0 });
    const [customRecipes, setCustomRecipes] = useState([]);
    const [user, setUser] = useState(null); // Google/Apple Sign In user
    const [isAuthLoading, setIsAuthLoading] = useState(true);

    // Gemini 3.0 Analysis States
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [showVerdictModal, setShowVerdictModal] = useState(false);
    const [analysisResult, setAnalysisResult] = useState(null);

    // Load user profile and daily log on app start
    useEffect(() => {
        loadGroceryList();
        loadProfile();
        loadDailyLog();
        loadCustomRecipes();
    }, []);

    // Load user from storage
    useEffect(() => {
        const loadUser = async () => {
            try {
                const userData = await AsyncStorage.getItem('@user_data');
                if (userData) {
                    setUser(JSON.parse(userData));
                }
            } catch (error) {
                console.error('Load user error:', error);
            } finally {
                setIsAuthLoading(false);
            }
        };
        loadUser();
    }, []);

    const saveUser = async (userData) => {
        try {
            setUser(userData);
            await AsyncStorage.setItem('@user_data', JSON.stringify(userData));
        } catch (error) {
            console.error('Save user error:', error);
        }
    };

    const signOut = async () => {
        try {
            setUser(null);
            await AsyncStorage.removeItem('@user_data');
        } catch (error) {
            console.error('Sign out error:', error);
        }
    };

    const loadProfile = async () => {
        try {
            const saved = await AsyncStorage.getItem('userProfile');
            if (saved) {
                setUserProfile(JSON.parse(saved));
            }
        } catch (error) {
            // Silent fail - app continues without profile
        }
    };

    const loadGroceryList = async () => {
        try {
            const saved = await AsyncStorage.getItem('@grocery_list');
            if (saved) {
                setGroceryList(JSON.parse(saved));
            }
        } catch (error) {
            // Silent fail - app continues with empty list
        }
    };

    const loadDailyLog = async () => {
        try {
            const saved = await AsyncStorage.getItem('@daily_log');
            if (saved) {
                const parsed = JSON.parse(saved);
                // Check if it's a new day
                if (parsed.date !== new Date().toDateString()) {
                    // New day! Reset log but keep date
                    const newLog = { date: new Date().toDateString(), eaten: [], workoutDuration: 0 };
                    setDailyLog(newLog);
                    saveDailyLog(newLog);
                } else {
                    setDailyLog(parsed);
                }
            }
        } catch (error) {
            // Silent fail
        }
    };

    const saveDailyLog = async (log) => {
        try {
            await AsyncStorage.setItem('@daily_log', JSON.stringify(log));
            setDailyLog(log);
        } catch (error) {
            // Silent fail
        }
    };

    const addFood = (foodItem) => {
        const newLog = {
            ...dailyLog,
            eaten: [...dailyLog.eaten, {
                id: Date.now(),
                name: foodItem.name || foodItem,
                calories: foodItem.calories || parseInt(foodItem),
                protein: foodItem.protein || 0,
                carbs: foodItem.carbs || 0,
                fat: foodItem.fat || 0
            }]
        };
        saveDailyLog(newLog);
    };

    const addWorkout = (minutes) => {
        const newLog = {
            ...dailyLog,
            workoutDuration: dailyLog.workoutDuration + parseInt(minutes)
        };
        saveDailyLog(newLog);
    };

    // Custom Recipes Functions
    const loadCustomRecipes = async () => {
        try {
            const stored = await AsyncStorage.getItem('@custom_recipes');
            if (stored) {
                setCustomRecipes(JSON.parse(stored));
            }
        } catch (error) {
            // Silent fail
        }
    };

    const saveCustomRecipes = async (recipes) => {
        try {
            await AsyncStorage.setItem('@custom_recipes', JSON.stringify(recipes));
            setCustomRecipes(recipes);
        } catch (error) {
            // Silent fail
        }
    };

    const addCustomRecipe = (recipe) => {
        const newRecipe = {
            ...recipe,
            id: `custom_${Date.now()}`,
            image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80', // Default image
            timing: recipe.timing || ['lunch', 'dinner'],
            difficulty: 'easy',
            caloriesNum: parseInt(recipe.calories) || 0,
            proteinNum: parseInt(recipe.protein) || 0
        };
        const updatedRecipes = [...customRecipes, newRecipe];
        saveCustomRecipes(updatedRecipes);
        Alert.alert('Success! 🎉', `"${recipe.title}" added to recipes!`);
    };

    const saveProfile = async (profile) => {
        try {
            await AsyncStorage.setItem('userProfile', JSON.stringify(profile));
            setUserProfile(profile);
        } catch (error) {
            Alert.alert('Error', 'Could not save profile. Please try again.');
        }
    };

    const saveGroceryList = async (list) => {
        try {
            await AsyncStorage.setItem('@grocery_list', JSON.stringify(list));
        } catch (error) {
            // Silent fail - list is still in memory for this session
        }
    };

    // Calculate TDEE (Total Daily Energy Expenditure) using Harris-Benedict
    const calculateMacros = (height, weight, age, gender, goal, activity) => {
        let bmr;
        if (gender === 'male') {
            bmr = 10 * weight + 6.25 * height - 5 * age + 5;
        } else {
            bmr = 10 * weight + 6.25 * height - 5 * age - 161;
        }

        const activityMultipliers = {
            sedentary: 1.2,
            light: 1.375,
            moderate: 1.55,
            active: 1.725
        };

        let tdee = bmr * (activityMultipliers[activity] || 1.55);

        // Adjust based on goal
        if (goal === 'bulk') tdee += 300;
        else if (goal === 'cut') tdee -= 500;

        const protein = goal === 'bulk' ? weight * 2 : weight * 1.8;

        return {
            dailyCalories: Math.round(tdee),
            dailyProtein: Math.round(protein)
        };
    };

    const addIngredientsToGrocery = (ingredients) => {
        setGroceryList((prevList) => {
            const newItems = ingredients.filter(newItem => !prevList.some(item => item.id === newItem.id));
            const updatedList = [...prevList, ...newItems];

            // Save to AsyncStorage
            saveGroceryList(updatedList);

            Alert.alert(newItems.length > 0 ? "Added! 🚀" : "Already Exists! 😎", newItems.length > 0 ? `${newItems.length} items added to list.` : "These items are already in your list.");
            return updatedList;
        });
    };

    return (
        <AppContext.Provider value={{
            profile: userProfile, saveProfile,
            dailyLog, addFood,
            // Assuming removeFood, addWorkout, removeWorkout, resetDailyLog are new functions to be added
            // For now, keeping existing addWorkout and adding placeholders for others
            addWorkout,
            // removeFood,
            // removeWorkout,
            // resetDailyLog,
            groceryList, setGroceryList,
            // Assuming addToGroceryList, removeFromGroceryList, clearGroceryList are new functions
            addToGroceryList: addIngredientsToGrocery, // Mapping existing to new name
            // removeFromGroceryList,
            // clearGroceryList,
            customRecipes, addCustomRecipe,
            // removeCustomRecipe,
            user, saveUser, signOut, isAuthLoading,
            recipes: [...RECIPES, ...customRecipes], // Keep existing recipes
            calculateMacros, // Keep existing calculateMacros

            // Gemini 3.0 Analysis Context
            isAnalyzing, setIsAnalyzing,
            showVerdictModal, setShowVerdictModal,
            analysisResult, setAnalysisResult
        }}>
            {children}
        </AppContext.Provider>
    );
};

// --- SCREENS ---
const RecipesScreen = ({ navigation }) => {
    const { recipes, addCustomRecipe } = useContext(AppContext);
    const insets = useSafeAreaInsets();
    const [modalVisible, setModalVisible] = useState(false);
    const [newRecipe, setNewRecipe] = useState({
        title: '',
        time: '',
        calories: '',
        protein: '',
        description: '',
        ingredients: '',
        steps: ''
    });

    const handleAddRecipe = () => {
        if (!newRecipe.title || !newRecipe.calories || !newRecipe.protein) {
            Alert.alert('Missing Info', 'Please enter at least title, calories, and protein!');
            return;
        }

        const recipeToAdd = {
            ...newRecipe,
            ingredients: newRecipe.ingredients.split('\n').filter(i => i.trim()).map((ing, idx) => ({
                id: `${Date.now()}_${idx}`,
                name: ing.trim(),
                quantity: '',
                category: 'Diğer'
            })),
            steps: newRecipe.steps.split('\n').filter(s => s.trim())
        };

        addCustomRecipe(recipeToAdd);
        setModalVisible(false);
        setNewRecipe({ title: '', time: '', calories: '', protein: '', description: '', ingredients: '', steps: '' });
    };

    const renderRecipeCard = ({ item: recipe }) => (
        <TouchableOpacity
            activeOpacity={0.9}
            style={styles.card}
            onPress={() => navigation.navigate('RecipeDetail', { recipe })}
        >
            <Image source={{ uri: recipe.image }} style={styles.cardImage} />
            <View style={styles.cardOverlay} />
            <View style={styles.cardContent}>
                <View style={styles.cardMeta}>
                    <View style={styles.badge}><Text style={styles.badgeText}>{recipe.time}</Text></View>
                    <View style={[styles.badge, styles.badgePrimary]}><Text style={styles.badgeTextPrimary}>{recipe.calories}</Text></View>
                </View>
                <Text style={styles.cardTitle}>{recipe.title}</Text>
                <Text style={styles.cardSubtitle}>PROTEIN: {recipe.protein}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle="light-content" />
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>GYM<Text style={{ color: COLORS.primary }}>MEALS</Text></Text>
                    <Text style={styles.headerSubtitle}>Fuel your gains.</Text>
                </View>
                <TouchableOpacity
                    onPress={() => setModalVisible(true)}
                    style={{ position: 'absolute', right: 20, top: 15, zIndex: 10 }}
                >
                    <MaterialCommunityIcons name="plus" size={32} color="white" />
                </TouchableOpacity>
            </View>

            <FlatList
                data={recipes}
                renderItem={renderRecipeCard}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                initialNumToRender={10}
                maxToRenderPerBatch={5}
                windowSize={5}
            />

            {/* Custom Recipe Modal */}
            <Modal
                animationType="slide"
                transparent={false}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={[styles.container, { paddingTop: insets.top }]}>
                    <StatusBar barStyle="light-content" />
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>New Recipe</Text>
                        <TouchableOpacity onPress={() => setModalVisible(false)}>
                            <MaterialCommunityIcons name="close" size={28} color={COLORS.text} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                        <TextInput
                            style={[styles.input, { marginBottom: 15 }]}
                            placeholder="Recipe Title *"
                            placeholderTextColor={COLORS.textSecondary}
                            value={newRecipe.title}
                            maxLength={50}
                            onChangeText={(text) => setNewRecipe({ ...newRecipe, title: text })}
                        />

                        <View style={{ flexDirection: 'row', marginBottom: 15, gap: 10 }}>
                            <TextInput
                                style={[styles.input, { flex: 1 }]}
                                placeholder="Duration (e.g. 15m)"
                                placeholderTextColor={COLORS.textSecondary}
                                value={newRecipe.time}
                                onChangeText={(text) => setNewRecipe({ ...newRecipe, time: text })}
                            />
                            <TextInput
                                style={[styles.input, { flex: 1 }]}
                                placeholder="Calories *"
                                placeholderTextColor={COLORS.textSecondary}
                                keyboardType="numeric"
                                value={newRecipe.calories}
                                onChangeText={(text) => setNewRecipe({ ...newRecipe, calories: text })}
                            />
                        </View>

                        <TextInput
                            style={[styles.input, { marginBottom: 15 }]}
                            placeholder="Protein * (e.g. 30g)"
                            placeholderTextColor={COLORS.textSecondary}
                            value={newRecipe.protein}
                            onChangeText={(text) => setNewRecipe({ ...newRecipe, protein: text })}
                        />

                        <TextInput
                            style={[styles.input, { height: 60, marginBottom: 15 }]}
                            placeholder="Description"
                            placeholderTextColor={COLORS.textSecondary}
                            multiline
                            value={newRecipe.description}
                            onChangeText={(text) => setNewRecipe({ ...newRecipe, description: text })}
                        />

                        <TextInput
                            style={[styles.input, { height: 100, marginBottom: 15 }]}
                            placeholder="Ingredients (one per line)"
                            placeholderTextColor={COLORS.textSecondary}
                            multiline
                            value={newRecipe.ingredients}
                            onChangeText={(text) => setNewRecipe({ ...newRecipe, ingredients: text })}
                        />

                        <TextInput
                            style={[styles.input, { height: 150, marginBottom: 20 }]}
                            placeholder="Instructions (step by step)"
                            placeholderTextColor={COLORS.textSecondary}
                            multiline
                            value={newRecipe.steps}
                            maxLength={2000}
                            onChangeText={(text) => setNewRecipe({ ...newRecipe, steps: text })}
                        />

                        <TouchableOpacity style={styles.submitButton} onPress={handleAddRecipe}>
                            <Text style={styles.submitButtonText}>Add Recipe 🚀</Text>
                        </TouchableOpacity>

                        <View style={{ height: 50 }} />
                    </ScrollView>
                </View>
            </Modal>
        </View>
    );
};

const RecipeDetailScreen = ({ route, navigation }) => {

    // ============================================
    const { recipe } = route.params;
    const { addIngredientsToGrocery } = useContext(AppContext);

    return (
        <View style={styles.container}>
            <ScrollView bounces={false}>
                <View style={styles.detailImageContainer}>
                    <Image source={{ uri: recipe.image }} style={styles.detailImage} />
                    <View style={styles.detailOverlay} />
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>
                </View>

                <View style={styles.detailContent}>
                    <Text style={styles.detailTitle}>{recipe.title}</Text>
                    <Text style={styles.detailDesc}>{recipe.description}</Text>

                    <View style={styles.statsRow}>
                        <View style={styles.statBox}>
                            <MaterialCommunityIcons name="fire" size={24} color={COLORS.primary} />
                            <Text style={styles.statValue}>{recipe.calories}</Text>
                            <Text style={styles.statLabel}>Calories</Text>
                        </View>
                        <View style={styles.statBox}>
                            <MaterialCommunityIcons name="arm-flex" size={24} color={COLORS.primary} />
                            <Text style={styles.statValue}>{recipe.protein}</Text>
                            <Text style={styles.statLabel}>Protein</Text>
                        </View>
                        <View style={styles.statBox}>
                            <MaterialCommunityIcons name="clock-outline" size={24} color={COLORS.primary} />
                            <Text style={styles.statValue}>{recipe.time}</Text>
                            <Text style={styles.statLabel}>Duration</Text>
                        </View>
                    </View>

                    <Text style={styles.sectionTitle}>Ingredients</Text>
                    {recipe.ingredients.map((ing) => (
                        <View key={ing.id} style={styles.ingRow}>
                            <View style={styles.bullet} />
                            <Text style={styles.ingName}>{ing.name}</Text>
                            <Text style={styles.ingQty}>{ing.quantity}</Text>
                        </View>
                    ))}

                    <TouchableOpacity
                        style={styles.mainButton}
                        onPress={() => {
                            addIngredientsToGrocery(recipe.ingredients);
                            navigation.navigate('ShoppingList');
                        }}
                    >
                        <Text style={styles.mainButtonText}>ADD TO LIST</Text>
                    </TouchableOpacity>

                    <Text style={styles.sectionTitle}>Instructions</Text>
                    {recipe.steps.map((step, index) => (
                        <View key={index} style={styles.stepRow}>
                            <View style={styles.stepCircle}><Text style={styles.stepIndex}>{index + 1}</Text></View>
                            <Text style={styles.stepText}>{step}</Text>
                        </View>
                    ))}
                    <View style={{ height: 40 }} />
                </View>
            </ScrollView>
        </View>
    );
};

const ShoppingListScreen = () => {
    const { groceryList, setGroceryList } = useContext(AppContext);
    const [checked, setChecked] = useState({});
    const [showAdd, setShowAdd] = useState(false);
    const [itemName, setItemName] = useState('');
    const [itemQty, setItemQty] = useState('');
    const insets = useSafeAreaInsets();

    const toggle = (id) => setChecked(p => ({ ...p, [id]: !p[id] }));

    // Group by category
    const grouped = groceryList.reduce((acc, item) => {
        const g = acc.find(x => x.title === item.category);
        if (g) g.data.push(item);
        else acc.push({ title: item.category, data: [item] });
        return acc;
    }, []);

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>SHOPPING<Text style={{ color: COLORS.primary }}>LIST</Text></Text>
                <TouchableOpacity onPress={() => setShowAdd(true)} style={styles.addButton}>
                    <MaterialCommunityIcons name="plus" size={28} color={COLORS.primary} />
                </TouchableOpacity>
            </View>

            {/* Quick Add Modal */}
            <Modal visible={showAdd} animationType="fade" transparent>
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', padding: 20 }}>
                    <View style={{ backgroundColor: COLORS.card, borderRadius: 20, padding: 20 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
                            <Text style={{ color: COLORS.text, fontSize: 20, fontWeight: 'bold' }}>Add Item</Text>
                            <TouchableOpacity onPress={() => { setShowAdd(false); setItemName(''); setItemQty(''); }}>
                                <MaterialCommunityIcons name="close" size={28} color={COLORS.textSecondary} />
                            </TouchableOpacity>
                        </View>
                        <TextInput
                            style={[styles.input, { marginBottom: 10 }]}
                            placeholder="Item name"
                            placeholderTextColor={COLORS.textSecondary}
                            value={itemName}
                            onChangeText={setItemName}
                        />
                        <TextInput
                            style={[styles.input, { marginBottom: 20 }]}
                            placeholder="Quantity (optional)"
                            placeholderTextColor={COLORS.textSecondary}
                            value={itemQty}
                            onChangeText={setItemQty}
                        />
                        <TouchableOpacity
                            style={styles.mainButton}
                            onPress={() => {
                                if (!itemName.trim()) { Alert.alert('Error', 'Enter item name'); return; }
                                const newItem = { id: `m_${Date.now()}`, name: itemName.trim(), quantity: itemQty.trim() || '1x', category: 'Other' };
                                const updated = [...groceryList, newItem];
                                setGroceryList(updated);
                                AsyncStorage.setItem('@grocery_list', JSON.stringify(updated)).catch(() => { });
                                setShowAdd(false);
                                setItemName('');
                                setItemQty('');
                                Alert.alert('Added!', `${newItem.name} added to list.`);
                            }}
                        >
                            <Text style={styles.mainButtonText}>ADD</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {groceryList.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <MaterialCommunityIcons name="cart-off" size={64} color={COLORS.secondary} />
                    <Text style={styles.emptyText}>List is empty, champ.</Text>
                    <Text style={styles.emptySub}>Add items from recipes or tap +</Text>
                </View>
            ) : (
                <SectionList
                    sections={grouped}
                    keyExtractor={i => i.id}
                    contentContainerStyle={{ padding: 20 }}
                    renderSectionHeader={({ section }) => <Text style={styles.listHeader}>{section.title.toUpperCase()}</Text>}
                    renderItem={({ item }) => (
                        <TouchableOpacity onPress={() => toggle(item.id)} style={[styles.listItem, checked[item.id] && styles.listItemChecked]}>
                            <MaterialCommunityIcons
                                name={checked[item.id] ? "checkbox-marked-circle" : "checkbox-blank-circle-outline"}
                                size={24}
                                color={checked[item.id] ? COLORS.success : COLORS.textSecondary}
                            />
                            <Text style={[styles.listItemText, checked[item.id] && styles.textStrike]}>{item.name}</Text>
                            <Text style={styles.listItemQty}>{item.quantity}</Text>
                        </TouchableOpacity>
                    )}
                />
            )}
        </View>
    );
};



// --- LOG SCREEN ---
const LogScreen = () => {
    const { userProfile, dailyLog, addFood, addWorkout, signOut } = useContext(AppContext);
    const insets = useSafeAreaInsets();
    const [foodName, setFoodName] = useState('');
    const [foodCal, setFoodCal] = useState('');
    const [workoutMin, setWorkoutMin] = useState('');
    const [foodSearch, setFoodSearch] = useState('');
    const [filteredFoods, setFilteredFoods] = useState([]);

    const dailyCalories = userProfile?.dailyCalories || 2000;

    // Calculate totals
    const totalEaten = dailyLog.eaten.reduce((acc, item) => acc + item.calories, 0);
    const caloriesBurned = dailyLog.workoutDuration * 6; // Approx 6 kcal/min
    const netCalories = totalEaten - caloriesBurned;
    const remaining = dailyCalories - netCalories;

    const handleAddFood = () => {
        if (!foodName || !foodCal) {
            Alert.alert('Error', 'Please enter food name and calories.');
            return;
        }
        addFood(foodName, foodCal);
        setFoodName('');
        setFoodCal('');
        Alert.alert('Added', `${foodName} added to log.`);
    };

    const handleAddWorkout = () => {
        if (!workoutMin) return;
        addWorkout(workoutMin);
        setWorkoutMin('');
        Alert.alert('Workout Added', `${workoutMin} minutes training logged! 🔥`);
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>DAILY <Text style={{ color: COLORS.primary }}>LOG</Text></Text>
                <Text style={styles.headerSubtitle}>Calorie & Activity Tracking</Text>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20 }}>
                {/* Summary Card */}
                <View style={styles.logWrapCard}>
                    <Text style={styles.logTitle}>Today's Summary</Text>

                    <View style={styles.logRow}>
                        <View style={styles.logStat}>
                            <Text style={styles.logValue}>{totalEaten}</Text>
                            <Text style={styles.logLabel}>Eaten</Text>
                        </View>
                        <Text style={styles.logOp}>-</Text>
                        <View style={styles.logStat}>
                            <Text style={styles.logValue}>{caloriesBurned}</Text>
                            <Text style={styles.logLabel}>Burned</Text>
                        </View>
                        <Text style={styles.logOp}>=</Text>
                        <View style={styles.logStat}>
                            <Text style={[styles.logValue, { color: remaining < 0 ? COLORS.danger : COLORS.success }]}>
                                {netCalories}
                            </Text>
                            <Text style={styles.logLabel}>Net</Text>
                        </View>
                    </View>

                    <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: `${Math.min((netCalories / dailyCalories) * 100, 100)}%`, backgroundColor: netCalories > dailyCalories ? COLORS.danger : COLORS.primary }]} />
                    </View>
                    <Text style={styles.logFooter}>Target: {dailyCalories} kcal • Remaining: {remaining} kcal</Text>
                </View>

                {/* Add Food */}
                <Text style={styles.sectionTitle}>Add Food</Text>
                <View style={styles.addCard}>
                    <TextInput
                        style={[styles.input, { marginBottom: 10 }]}
                        placeholder="Search: chicken, rice, eggs..."
                        placeholderTextColor={COLORS.textSecondary}
                        value={foodSearch}
                        onChangeText={(text) => {
                            setFoodSearch(text);
                            if (text.length > 1) {
                                const filtered = FOOD_DATABASE.filter(f =>
                                    f.name.toLowerCase().includes(text.toLowerCase())
                                ).slice(0, 5);
                                setFilteredFoods(filtered);
                            } else {
                                setFilteredFoods([]);
                            }
                        }}
                    />
                    {filteredFoods.length > 0 && (
                        <View style={styles.foodSuggestions}>
                            {filteredFoods.map((food, idx) => (
                                <TouchableOpacity
                                    key={idx}
                                    style={styles.suggestionItem}
                                    onPress={() => {
                                        addFood(food);
                                        setFoodSearch('');
                                        setFilteredFoods([]);
                                    }}
                                >
                                    <Text style={styles.suggestionName}>{food.name}</Text>
                                    <Text style={styles.suggestionMacros}>
                                        {food.calories} kcal • {food.protein}g protein
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                    <Text style={styles.hintText}>↑ Type and select to auto-add!</Text>

                    {/* Camera Button for AI Food Recognition */}
                    {/* Camera Button for Gemini 3.0 Food Recognition */}
                    <View style={{ flexDirection: 'row', marginTop: 15, gap: 10 }}>
                        <TouchableOpacity
                            style={[styles.addButton, { flex: 1, flexDirection: 'row', justifyContent: 'center', gap: 8 }]}
                            onPress={async () => {
                                try {
                                    console.log('[DEBUG] Requesting Camera Permissions...');
                                    const { status } = await ImagePicker.requestCameraPermissionsAsync();
                                    console.log('[DEBUG] Camera Permission Status:', status);
                                    if (status !== 'granted') {
                                        Alert.alert('Permission Required', 'You must grant camera permission.');
                                        return;
                                    }
                                    const result = await ImagePicker.launchCameraAsync({
                                        mediaTypes: ImagePicker.MediaTypeOptions.Images,
                                        allowsEditing: true,
                                        aspect: [4, 3],
                                        quality: 0.5,
                                    });
                                    console.log('[DEBUG] Camera Result:', JSON.stringify(result));
                                    if (!result.canceled && result.assets && result.assets[0]) {
                                        setIsAnalyzing(true);
                                        setShowVerdictModal(true); // Show modal immediately for loading state
                                        try {
                                            const analysis = await analyzeFoodPhoto(result.assets[0].uri);

                                            if (analysis.error === 'NON_FOOD_DETECTED') {
                                                setIsAnalyzing(false);
                                                setShowVerdictModal(false);
                                                Alert.alert('⚠️ SYSTEM ALERT', 'Invalid Input. Please upload food only.');
                                                return;
                                            }

                                            setAnalysisResult(analysis);
                                            // Auto-add to log prompt
                                            Alert.alert(
                                                '🤖 Gemini 3.0 Success!',
                                                'Food analysis complete. Add to log?',
                                                [
                                                    { text: 'Cancel', style: 'cancel' },
                                                    {
                                                        text: 'Yes Add',
                                                        onPress: () => {
                                                            const item = {
                                                                name: analysis.scan?.items?.[0]?.name || "Gemini 3.0 Meal",
                                                                calories: analysis.macronutrients?.calories || analysis.scan?.total?.calories || 0,
                                                                protein: analysis.macronutrients?.protein || analysis.scan?.total?.protein || 0,
                                                                carbs: analysis.macronutrients?.carbs || analysis.scan?.total?.carbs || 0,
                                                                fat: analysis.macronutrients?.fat || analysis.scan?.total?.fat || 0
                                                            };
                                                            addFood(item);
                                                            Alert.alert('Added! 📝', `${item.name} added to log.`);
                                                        }
                                                    }
                                                ]
                                            );
                                        } catch (err) {
                                            Alert.alert('Error', 'Analysis failed.');
                                            setShowVerdictModal(false);
                                        } finally {
                                            setIsAnalyzing(false);
                                        }
                                    }
                                } catch (e) {
                                    Alert.alert('Error', 'Camera could not be opened.');
                                }
                            }}
                        >
                            <MaterialCommunityIcons name="camera" size={20} color="white" />
                            <Text style={{ color: 'white', fontWeight: '600' }}>Take Photo</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.addButton, { flex: 1, flexDirection: 'row', justifyContent: 'center', gap: 8 }]}
                            onPress={async () => {
                                try {
                                    console.log('[DEBUG] Requesting Gallery Permissions...');
                                    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                                    console.log('[DEBUG] Gallery Permission Status:', status);
                                    if (status !== 'granted') {
                                        Alert.alert('Permission Required', 'You must grant gallery permission.');
                                        return;
                                    }
                                    const result = await ImagePicker.launchImageLibraryAsync({
                                        mediaTypes: ImagePicker.MediaTypeOptions.Images,
                                        allowsEditing: true,
                                        aspect: [4, 3],
                                        quality: 0.5,
                                    });
                                    console.log('[DEBUG] Gallery Result:', JSON.stringify(result));
                                    if (!result.canceled && result.assets && result.assets[0]) {
                                        setIsAnalyzing(true);
                                        setShowVerdictModal(true);
                                        try {
                                            const analysis = await analyzeFoodPhoto(result.assets[0].uri);

                                            if (analysis.error === 'NON_FOOD_DETECTED') {
                                                setIsAnalyzing(false);
                                                setShowVerdictModal(false);
                                                Alert.alert('⚠️ SYSTEM ALERT', 'Invalid Input. Please upload food only.');
                                                return;
                                            }

                                            setAnalysisResult(analysis);
                                            Alert.alert(
                                                '🤖 Gemini 3.0 Success!',
                                                'Food analysis complete. Add to log?',
                                                [
                                                    { text: 'Cancel', style: 'cancel' },
                                                    {
                                                        text: 'Yes Add',
                                                        onPress: () => {
                                                            const item = {
                                                                name: analysis.scan?.items?.[0]?.name || "Gemini 3.0 Meal",
                                                                calories: analysis.macronutrients?.calories || analysis.scan?.total?.calories || 0,
                                                                protein: analysis.macronutrients?.protein || analysis.scan?.total?.protein || 0,
                                                                carbs: analysis.macronutrients?.carbs || analysis.scan?.total?.carbs || 0,
                                                                fat: analysis.macronutrients?.fat || analysis.scan?.total?.fat || 0
                                                            };
                                                            addFood(item);
                                                            Alert.alert('Added! 📝', `${item.name} added to log.`);
                                                        }
                                                    }
                                                ]
                                            );
                                        } catch (err) {
                                            Alert.alert('Error', 'Analysis failed.');
                                            setShowVerdictModal(false);
                                        } finally {
                                            setIsAnalyzing(false);
                                        }
                                    }
                                } catch (e) {
                                    Alert.alert('Error', 'Could not open gallery.');
                                }
                            }}
                        >
                            <MaterialCommunityIcons name="image" size={20} color="white" />
                            <Text style={{ color: 'white', fontWeight: '600' }}>Choose Gallery</Text>
                        </TouchableOpacity>
                    </View>
                </View >

                {/* Add Workout */}
                < Text style={styles.sectionTitle} > Activity</Text >
                <View style={styles.addCard}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <MaterialCommunityIcons name="dumbbell" size={24} color={COLORS.primary} style={{ marginRight: 10 }} />
                        <TextInput
                            style={[styles.input, { flex: 1, marginRight: 10 }]}
                            placeholder="Duration (min)"
                            placeholderTextColor={COLORS.textSecondary}
                            keyboardType="numeric"
                            value={workoutMin}
                            onChangeText={setWorkoutMin}
                        />
                        <TouchableOpacity style={styles.addButton} onPress={handleAddWorkout}>
                            <MaterialCommunityIcons name="check" size={24} color="white" />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.hintText}>*Based on avg 6 kcal/min burn.</Text>
                </View>

                {/* Log List */}
                <Text style={styles.sectionTitle}>Today's Food</Text>
                {
                    dailyLog.eaten.length === 0 ? (
                        <Text style={styles.emptySub}>Nothing added yet.</Text>
                    ) : (
                        dailyLog.eaten.map((item, index) => (
                            <View key={index} style={styles.logItem}>
                                <Text style={styles.logItemName}>{item.name}</Text>
                                <Text style={styles.logItemCal}>{item.calories} kcal</Text>
                            </View>
                        ))
                    )
                }

                <TouchableOpacity
                    style={[styles.mainButton, { backgroundColor: COLORS.secondary, marginTop: 40 }]}
                    onPress={signOut}
                >
                    <Text style={[styles.mainButtonText, { color: COLORS.text }]}>SIGN OUT</Text>
                </TouchableOpacity>

                <View style={{ height: 100 }} />
            </ScrollView >
        </View >
    );
};

// --- CHALLENGE SCREEN ---
const ChallengeScreen = () => {
    const insets = useSafeAreaInsets();
    const [challengeData, setChallengeData] = useState({});
    const [startDate, setStartDate] = useState(null);
    const [currentDay, setCurrentDay] = useState(1);

    // DAILY PERFORMANCE PROTOCOLS (Modern Warlord Style)
    const PERFORMANCE_LOGS = [
        "Precision is power. Audit every gram of your fuel today.",
        "Your body is a machine. Don't fuel it like a lawnmower.",
        "Consistency is the only currency. Pay the price of discipline.",
        "Motion creates emotion. Execute the protocol now."
    ];

    const [briefingVisible, setBriefingVisible] = useState(false);
    const [briefingMessage, setBriefingMessage] = useState("");

    useEffect(() => {
        loadChallengeData();
    }, []);

    const loadChallengeData = async () => {
        try {
            const savedData = await AsyncStorage.getItem('@challenge_22day_v1');
            const savedDate = await AsyncStorage.getItem('@challenge_start_date');
            const lastBriefing = await AsyncStorage.getItem('@last_briefing_seen_date');

            let parsedData = savedData ? JSON.parse(savedData) : {};
            let dayIndex = 1;

            if (savedDate) {
                const start = parseInt(savedDate);
                setStartDate(start);
                const daysPassed = Math.floor((Date.now() - start) / (1000 * 60 * 60 * 24)) + 1;
                dayIndex = daysPassed > 0 ? daysPassed : 1;
                setCurrentDay(dayIndex);

                // AUTO-COMPLETE PAST DAYS
                let dataChanged = false;
                for (let i = 1; i < dayIndex; i++) {
                    if (!parsedData[i]) {
                        parsedData[i] = true;
                        dataChanged = true;
                    }
                }
                if (dataChanged) {
                    setChallengeData(parsedData);
                    await AsyncStorage.setItem('@challenge_22day_v1', JSON.stringify(parsedData));
                } else {
                    setChallengeData(parsedData);
                }
            } else {
                setChallengeData(parsedData);
            }

            // DAILY BRIEFING LOGIC
            const todayStr = new Date().toDateString();
            if (lastBriefing !== todayStr && dayIndex <= 22) {
                const msgIndex = Math.min(dayIndex - 1, PERFORMANCE_LOGS.length - 1);
                setBriefingMessage(PERFORMANCE_LOGS[msgIndex]);
                setBriefingVisible(true);
            }

        } catch (error) {
            console.error("Challenge load error", error);
        }
    };

    const closeBriefing = async () => {
        setBriefingVisible(false);
        const todayStr = new Date().toDateString();
        await AsyncStorage.setItem('@last_briefing_seen_date', todayStr);
    };

    const toggleDay = async (day) => {
        // LOGIC: Can only toggle if it's the current day or past.
        // Cannot toggle future days. 

        // If no start date, setting Day 1 sets the start date.
        let newStartDate = startDate;
        if (!startDate && day === 1) {
            newStartDate = Date.now();
            setStartDate(newStartDate);
            await AsyncStorage.setItem('@challenge_start_date', newStartDate.toString());
            setCurrentDay(1);
        }

        // Calculation of authorized day
        // realDay = start exists ? (now - start) / day_ms + 1 : 1
        const realDay = newStartDate ? Math.floor((Date.now() - newStartDate) / (1000 * 60 * 60 * 24)) + 1 : 1;

        if (day > realDay) {
            Alert.alert("Hold On! ✋", "This day hasn't arrived yet. Progress one day at a time.");
            return;
        }

        if (day > 22) return;

        // Toggle
        const newData = { ...challengeData, [day]: !challengeData[day] };
        setChallengeData(newData);

        try {
            await AsyncStorage.setItem('@challenge_22day_v1', JSON.stringify(newData));
        } catch (error) {
            console.error("Save error", error);
        }
    };

    const completedCount = Object.values(challengeData).filter(Boolean).length;
    const days = Array.from({ length: 22 }, (_, i) => i + 1);

    // Current protocol
    const activeMotivation = PERFORMANCE_LOGS[Math.min(currentDay - 1, 21)] || PERFORMANCE_LOGS[0];

    const resetChallenge = async () => {
        Alert.alert(
            'Reset Challenge?',
            'All progress and start date will be erased!',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Reset',
                    style: 'destructive',
                    onPress: async () => {
                        setChallengeData({});
                        setStartDate(null);
                        setCurrentDay(1);
                        await AsyncStorage.multiRemove(['@challenge_22day_v1', '@challenge_start_date']);
                    }
                }
            ]
        );
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle="light-content" />
            <View style={styles.header}>
                <Text style={styles.headerTitle}>22 DAY <Text style={{ color: COLORS.primary }}>CHALLENGE</Text></Text>
                <TouchableOpacity onPress={resetChallenge}>
                    <MaterialCommunityIcons name="refresh" size={24} color={COLORS.textSecondary} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20 }}>
                {/* Streak / Status Card */}
                <View style={styles.streakCard}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                        <View>
                            <Text style={styles.streakLabel}>CURRENT DAY</Text>
                            <Text style={styles.streakNumber}>{currentDay > 22 ? 22 : currentDay}</Text>
                        </View>
                        <MaterialCommunityIcons name="calendar-clock" size={48} color={COLORS.primary} />
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={styles.streakLabel}>COMPLETED</Text>
                            <Text style={styles.streakNumber}>{completedCount}/22</Text>
                        </View>
                    </View>
                    <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: `${(completedCount / 22) * 100}%` }]} />
                    </View>
                </View>

                {/* Daily Motivation */}
                {/* Daily Briefing (Persistent Card) */}
                <View style={[styles.motivationCard, { borderLeftWidth: 4, borderLeftColor: COLORS.primary }]}>
                    <MaterialCommunityIcons name="shield-check" size={24} color={COLORS.primary} style={{ marginBottom: 5 }} />
                    <Text style={[styles.sectionTitle, { color: COLORS.text, marginBottom: 5, fontSize: 16 }]}>DAILY STATUS</Text>
                    <Text style={styles.motivationText}>"{activeMotivation}"</Text>
                    <Text style={{ color: COLORS.primary, fontSize: 14, marginTop: 10, fontWeight: 'bold', alignSelf: 'flex-end' }}>- Gemini 3.0 Coach</Text>
                </View>

                {/* 55-Day Grid */}
                <View style={styles.challengeGrid}>
                    {days.map((day) => {
                        const isLocked = !startDate && day !== 1 ? true : (startDate && day > currentDay);
                        const isCompleted = challengeData[day];

                        return (
                            <TouchableOpacity
                                key={day}
                                style={[
                                    styles.challengeBox,
                                    isCompleted && styles.challengeBoxComplete,
                                    isLocked && { opacity: 0.3, backgroundColor: '#111', borderColor: '#333' }
                                ]}
                                onPress={() => toggleDay(day)}
                                activeOpacity={0.7}
                            >
                                {isCompleted ? (
                                    <MaterialCommunityIcons name="check-bold" size={isLocked ? 12 : 16} color="black" />
                                ) : (
                                    <Text style={[styles.challengeBoxText, isLocked && { color: '#666' }]}>{day}</Text>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <Text style={{ textAlign: 'center', color: COLORS.textSecondary, marginTop: 20, fontSize: 12 }}>
                    * You can only mark the current day as complete.
                </Text>
                <View style={{ height: 100 }} />
            </ScrollView>

            {/* DAILY BRIEFING MODAL */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={briefingVisible}
                onRequestClose={closeBriefing}
            >
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                    <View style={{ backgroundColor: COLORS.card, padding: 30, borderRadius: 20, width: '100%', alignItems: 'center', borderWidth: 1, borderColor: COLORS.primary }}>
                        <Text style={{ color: COLORS.primary, fontSize: 18, fontWeight: '900', letterSpacing: 2, marginBottom: 20 }}>
                             /// DAY {currentDay} BRIEFING
                        </Text>
                        <MaterialCommunityIcons name="shield-check" size={60} color="white" style={{ marginBottom: 20 }} />
                        <Text style={{ color: 'white', fontSize: 22, fontWeight: 'bold', textAlign: 'center', lineHeight: 32, marginBottom: 30 }}>
                            "{briefingMessage}"
                            {"\n\n"}
                            <Text style={{ fontSize: 16, color: COLORS.primary }}>- Gemini 3.0 Coach</Text>
                        </Text>
                        <TouchableOpacity
                            style={{ backgroundColor: COLORS.primary, paddingVertical: 15, paddingHorizontal: 40, borderRadius: 30 }}
                            onPress={closeBriefing}
                        >
                            <Text style={{ color: 'black', fontWeight: '900', fontSize: 16 }}>ACKNOWLEDGED</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

// --- PROFILE SCREEN ---
const ProfileScreen = () => {
    const { userProfile, saveProfile, calculateMacros, signOut } = useContext(AppContext);
    const insets = useSafeAreaInsets();
    const [height, setHeight] = useState(userProfile?.height?.toString() || '');
    const [weight, setWeight] = useState(userProfile?.weight?.toString() || '');
    const [age, setAge] = useState(userProfile?.age?.toString() || '');
    const [gender, setGender] = useState(userProfile?.gender || 'male');
    const [goal, setGoal] = useState(userProfile?.goal || 'maintain');
    const [activity, setActivity] = useState(userProfile?.activityLevel || 'moderate');
    const [appleUser, setAppleUser] = useState(null);
    const [isAppleAuthAvailable, setIsAppleAuthAvailable] = useState(false);

    // Check Apple Auth availability
    useEffect(() => {
        checkAppleAuthAvailability();
        loadAppleUser();
    }, []);

    const checkAppleAuthAvailability = async () => {
        // Disabled for Expo Go - enable in production build
        setIsAppleAuthAvailable(false);
        /* 
        try {
            const available = await AppleAuthentication.isAvailableAsync();
            setIsAppleAuthAvailable(available);
        } catch (error) {
            setIsAppleAuthAvailable(false);
        }
        */
    };

    const loadAppleUser = async () => {
        try {
            const saved = await AsyncStorage.getItem('appleUser');
            if (saved) {
                setAppleUser(JSON.parse(saved));
            }
        } catch (error) {
            // Silent fail
        }
    };

    const handleAppleSignIn = async () => {
        try {
            const credential = await AppleAuthentication.signInAsync({
                requestedScopes: [
                    AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                    AppleAuthentication.AppleAuthenticationScope.EMAIL,
                ],
            });

            const appleUserData = {
                userId: credential.user,
                email: credential.email,
                fullName: credential.fullName,
                identityToken: credential.identityToken,
            };

            await AsyncStorage.setItem('appleUser', JSON.stringify(appleUserData));
            setAppleUser(appleUserData);
            Alert.alert('Success! 🍎', 'Signed in with Apple!');
        } catch (error) {
            if (error.code === 'ERR_CANCELED') {
                // User canceled
            } else {
                Alert.alert('Error', 'Could not sign in with Apple.');
            }
        }
    };

    const handleAppleSignOut = async () => {
        await AsyncStorage.removeItem('appleUser');
        setAppleUser(null);
        Alert.alert('Signed Out', 'You signed out of simple Apple account.');
    };

    const handleSave = () => {
        const h = parseInt(height);
        const w = parseInt(weight);
        const a = parseInt(age);

        if (!h || !w || !a || h < 100 || w < 30 || a < 10) {
            Alert.alert('Error', 'Please enter valid values!');
            return;
        }

        const macros = calculateMacros(h, w, a, gender, goal, activity);
        const profile = {
            height: h,
            weight: w,
            age: a,
            gender,
            goal,
            activityLevel: activity,
            ...macros
        };

        saveProfile(profile);
        Alert.alert('Success! 💪', `Daily: ${macros.dailyCalories} kcal, ${macros.dailyProtein}g Protein`);
    };

    return (
        <ScrollView style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>MY <Text style={{ color: COLORS.primary }}>PROFILE</Text></Text>
                <Text style={styles.headerSubtitle}>Create your personalized plan</Text>
            </View>

            <View style={styles.formContainer}>
                {/* Apple Sign In Section - Disabled in Expo Go */}
                {isAppleAuthAvailable && appleUser && (
                    <View style={styles.appleCard}>
                        <View style={styles.appleCardHeader}>
                            <MaterialCommunityIcons name="apple" size={32} color="#fff" />
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <Text style={styles.appleCardTitle}>Apple Account</Text>
                                <Text style={styles.appleCardEmail}>{appleUser.email || 'Hidden'}</Text>
                            </View>
                            <TouchableOpacity onPress={handleAppleSignOut} style={styles.appleSignOutBtn}>
                                <Text style={styles.appleSignOutText}>Sign Out</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Height (cm)</Text>
                    <TextInput
                        style={styles.input}
                        value={height}
                        onChangeText={setHeight}
                        keyboardType="numeric"
                        placeholder="180"
                        placeholderTextColor={COLORS.textSecondary}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Weight (kg)</Text>
                    <TextInput
                        style={styles.input}
                        value={weight}
                        onChangeText={setWeight}
                        keyboardType="numeric"
                        placeholder="75"
                        placeholderTextColor={COLORS.textSecondary}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Age</Text>
                    <TextInput
                        style={styles.input}
                        value={age}
                        onChangeText={setAge}
                        keyboardType="numeric"
                        placeholder="25"
                        placeholderTextColor={COLORS.textSecondary}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Gender</Text>
                    <View style={styles.radioGroup}>
                        <TouchableOpacity style={styles.radioButton} onPress={() => setGender('male')}>
                            <View style={gender === 'male' ? styles.radioSelected : styles.radioUnselected} />
                            <Text style={styles.radioText}>Male</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.radioButton} onPress={() => setGender('female')}>
                            <View style={gender === 'female' ? styles.radioSelected : styles.radioUnselected} />
                            <Text style={styles.radioText}>Female</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Goal</Text>
                    <View style={styles.radioGroup}>
                        {[{ v: 'bulk', l: 'Bulk' }, { v: 'cut', l: 'Cut' }, { v: 'maintain', l: 'Maintain' }].map(g => (
                            <TouchableOpacity key={g.v} style={styles.radioButton} onPress={() => setGoal(g.v)}>
                                <View style={goal === g.v ? styles.radioSelected : styles.radioUnselected} />
                                <Text style={styles.radioText}>{g.l}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Activity</Text>
                    <View style={styles.radioGroup}>
                        {[{ v: 'sedentary', l: 'Low' }, { v: 'moderate', l: 'Mid' }, { v: 'active', l: 'High' }].map(a => (
                            <TouchableOpacity key={a.v} style={styles.radioButton} onPress={() => setActivity(a.v)}>
                                <View style={activity === a.v ? styles.radioSelected : styles.radioUnselected} />
                                <Text style={styles.radioText}>{a.l}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <TouchableOpacity style={styles.mainButton} onPress={handleSave}>
                    <Text style={styles.mainButtonText}>SAVE PROFILE</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.mainButton, { backgroundColor: '#ff4444', marginTop: 15 }]}
                    onPress={signOut}
                >
                    <Text style={styles.mainButtonText}>SIGN OUT</Text>
                </TouchableOpacity>

                {userProfile && (
                    <View style={styles.macroCard}>
                        <Text style={styles.macroTitle}>Daily Targets</Text>
                        <View style={styles.macroRow}>
                            <View style={styles.macroItem}>
                                <MaterialCommunityIcons name="fire" size={32} color={COLORS.primary} />
                                <Text style={styles.macroValue}>{userProfile.dailyCalories}</Text>
                                <Text style={styles.macroLabel}>Calories</Text>
                            </View>
                            <View style={styles.macroItem}>
                                <MaterialCommunityIcons name="arm-flex" size={32} color={COLORS.primary} />
                                <Text style={styles.macroValue}>{userProfile.dailyProtein}g</Text>
                                <Text style={styles.macroLabel}>Protein</Text>
                            </View>
                        </View>
                    </View>
                )}
            </View>
        </ScrollView>
    );
};

// --- COACH SCREEN ---
// --- COACH SCREEN (GEMINI AI) ---
// Helper for Title Case
const toTitleCase = (str) => {
    return str.replace(/\w\S*/g, (txt) => {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
};

const CoachScreen = () => {
    const insets = useSafeAreaInsets();
    const { isAnalyzing, setIsAnalyzing, showVerdictModal, setShowVerdictModal, analysisResult, setAnalysisResult } = useContext(AppContext);

    // RESET STATE ON MOUNT
    useEffect(() => {
        setIsAnalyzing(false);
        setShowVerdictModal(false);
    }, []);

    const lastRequestRef = useRef(0);

    const handleAIAnalysis = async (source) => {
        const now = Date.now();
        if (now - lastRequestRef.current < 3000) {
            Alert.alert('Please Wait', 'Analysis in progress. Please wait a moment.');
            return;
        }
        lastRequestRef.current = now;

        try {
            const { status } = source === 'camera'
                ? await ImagePicker.requestCameraPermissionsAsync()
                : await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (status !== 'granted') {
                Alert.alert('Permission Required', 'Camera access is needed for the Gemini 3.0 Coach.');
                return;
            }

            const result = source === 'camera'
                ? await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 })
                : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });

            if (!result.canceled && result.assets && result.assets[0]) {
                setIsAnalyzing(true);
                try {
                    const analysis = await analyzeFoodPhoto(result.assets[0].uri);
                    setAnalysisResult(analysis);
                    setShowVerdictModal(true);
                } catch (err) {
                    console.error('Analysis error:', err);
                    Alert.alert('Analysis Failed', 'Could not analyze the photo. Please try again.');
                } finally {
                    setIsAnalyzing(false);
                }
            }
        } catch (error) {
            console.error('Camera error:', error);
            Alert.alert('Error', 'Could not open camera.');
        }
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top + 60 }]}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>GEMINI<Text style={{ color: COLORS.primary }}> 3.0</Text></Text>
                <Text style={styles.headerSubtitle}>Your Gemini 3.0 Nutrition Coach</Text>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 80 }}>
                <View style={{ flexDirection: 'row', gap: 15, marginBottom: 30 }}>
                    <TouchableOpacity style={[styles.addButton, { flex: 1, height: 120, justifyContent: 'center' }]} onPress={() => handleAIAnalysis('camera')}>
                        <MaterialCommunityIcons name="camera" size={40} color="white" />
                        <Text style={{ color: 'white', fontWeight: 'bold', marginTop: 10 }}>Take Photo</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.addButton, { flex: 1, height: 120, justifyContent: 'center', backgroundColor: '#333' }]} onPress={() => handleAIAnalysis('gallery')}>
                        <MaterialCommunityIcons name="image" size={40} color="white" />
                        <Text style={{ color: 'white', fontWeight: 'bold', marginTop: 10 }}>Gallery</Text>
                    </TouchableOpacity>
                </View>

                <Text style={{ color: COLORS.textSecondary, textAlign: 'center', fontSize: 16 }}>
                    Snap a meal photo to get instant nutritional analysis & an Anabolic Score! 📸
                </Text>
            </ScrollView>

            <Modal visible={isAnalyzing} transparent animationType="fade">
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={{ color: 'white', marginTop: 20, fontSize: 18, fontWeight: 'bold' }}>Gemini 3.0 is reasoning...</Text>
                </View>
            </Modal>

            <Modal visible={showVerdictModal} animationType="slide" presentationStyle="pageSheet">
                <View style={[styles.container, { paddingTop: 20 }]}>
                    <View style={[styles.header, { justifyContent: 'center', alignItems: 'center', position: 'relative' }]}>
                        <Text style={[styles.headerTitle, { textAlign: 'center', alignSelf: 'center' }]}>
                            {analysisResult?.verdict?.title?.includes('SECURITY') ? '🚫 SECURITY' : (analysisResult?.is_food === false ? '⛔ REJECTED' : 'GEMINI')}
                            <Text style={{ color: (analysisResult?.verdict?.title?.includes('SECURITY') || analysisResult?.is_food === false) ? '#FF4444' : COLORS.primary }}>
                                {analysisResult?.verdict?.title?.includes('SECURITY') ? ' ALERT' : (analysisResult?.is_food === false ? ' SYSTEM' : ' 3.0 VERDICT')}
                            </Text>
                        </Text>
                        <TouchableOpacity onPress={() => setShowVerdictModal(false)} style={{ position: 'absolute', right: 0 }}>
                            <MaterialCommunityIcons name="close-circle" size={32} color={COLORS.textSecondary} />
                        </TouchableOpacity>
                    </View>
                    <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
                        {analysisResult && (
                            <>
                                {/* ANABOLIC SCORE */}
                                <View style={{ width: '100%', alignItems: 'center', justifyContent: 'center', marginBottom: 20, alignSelf: 'center' }}>
                                    <View style={{ width: 140, height: 140, borderRadius: 70, borderWidth: 6, borderColor: (analysisResult?.verdict?.title?.includes('SECURITY') || analysisResult?.is_food === false) ? '#FF4444' : COLORS.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 10 }}>
                                        <Text style={{ textAlign: 'center', includeFontPadding: false }}>
                                            <Text style={{ color: (analysisResult?.verdict?.title?.includes('SECURITY') || analysisResult?.is_food === false) ? '#FF4444' : COLORS.primary, fontSize: 42, fontWeight: '900' }}>{analysisResult.verdict?.anabolicScore ?? analysisResult.anabolicScore}</Text>
                                            <Text style={{ color: (analysisResult?.verdict?.title?.includes('SECURITY') || analysisResult?.is_food === false) ? '#FF4444' : COLORS.primary, fontSize: 16, fontWeight: 'bold' }}>/10</Text>
                                        </Text>
                                    </View>
                                    <Text style={{ color: COLORS.textSecondary, fontSize: 16 }}>Anabolic Score</Text>
                                </View>

                                {/* VERDICT & FIX */}
                                {analysisResult.verdict?.reasoning && (
                                    <View style={{ backgroundColor: COLORS.card, padding: 20, borderRadius: 16, marginBottom: 20 }}>
                                        <Text style={{ color: (analysisResult?.verdict?.title?.includes('SECURITY') || analysisResult?.is_food === false) ? '#FF4444' : COLORS.primary, fontSize: 20, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' }}>
                                            {analysisResult.verdict?.title || '📝 Gemini 3.0 VERDICT'}
                                        </Text>
                                        <Text style={{ color: 'white', fontSize: 16, lineHeight: 24, marginBottom: 15 }}>{analysisResult.verdict.reasoning}</Text>

                                        <Text style={{ color: COLORS.primary, fontSize: 18, fontWeight: 'bold', marginBottom: 5 }}>🛠️ THE FIX</Text>
                                        <Text style={{ color: 'white', fontSize: 16, lineHeight: 24 }}>{analysisResult.theFix?.optimization}</Text>
                                    </View>
                                )}

                                {/* FOOD ITEMS BREAKDOWN */}
                                {analysisResult.scan?.items && analysisResult.scan.items.length > 0 && (
                                    <View style={{ backgroundColor: COLORS.card, padding: 20, borderRadius: 16, marginBottom: 20 }}>
                                        <Text style={{ color: COLORS.primary, fontSize: 20, fontWeight: 'bold', marginBottom: 15 }}>🍽️ FOOD BREAKDOWN</Text>
                                        {analysisResult.scan.items.map((item, idx) => (
                                            <View key={idx} style={{
                                                backgroundColor: 'rgba(255,255,255,0.05)',
                                                padding: 15,
                                                borderRadius: 12,
                                                marginBottom: 10,
                                                borderLeftWidth: 3,
                                                borderLeftColor: COLORS.primary
                                            }}>
                                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                                    <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold', flex: 1 }}>{toTitleCase(item.name)}</Text>
                                                    <View style={{ backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 }}>
                                                        <Text style={{ color: '#000', fontSize: 14, fontWeight: 'bold' }}>{item.portion}</Text>
                                                    </View>
                                                </View>
                                                <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 8 }}>
                                                    <View style={{ alignItems: 'center' }}>
                                                        <Text style={{ color: 'white', fontSize: 14, fontWeight: 'bold' }}>{item.calories}</Text>
                                                        <Text style={{ color: COLORS.textSecondary, fontSize: 11 }}>kcal</Text>
                                                    </View>
                                                    <View style={{ alignItems: 'center' }}>
                                                        <Text style={{ color: '#00C851', fontSize: 14, fontWeight: 'bold' }}>{item.protein}g</Text>
                                                        <Text style={{ color: COLORS.textSecondary, fontSize: 11 }}>Protein</Text>
                                                    </View>
                                                    <View style={{ alignItems: 'center' }}>
                                                        <Text style={{ color: '#33b5e5', fontSize: 14, fontWeight: 'bold' }}>{item.carbs}g</Text>
                                                        <Text style={{ color: COLORS.textSecondary, fontSize: 11 }}>Carbs</Text>
                                                    </View>
                                                    <View style={{ alignItems: 'center' }}>
                                                        <Text style={{ color: '#ffbb33', fontSize: 14, fontWeight: 'bold' }}>{item.fat}g</Text>
                                                        <Text style={{ color: COLORS.textSecondary, fontSize: 11 }}>Fat</Text>
                                                    </View>
                                                </View>
                                            </View>
                                        ))}
                                    </View>
                                )}

                                {/* DETAILED MACROS */}
                                {(analysisResult.macronutrients || analysisResult.scan?.total) && (
                                    <View style={{ backgroundColor: COLORS.card, padding: 20, borderRadius: 16, marginBottom: 20 }}>
                                        <Text style={{ color: COLORS.primary, fontSize: 20, fontWeight: 'bold', marginBottom: 15 }}>📊 MACRO BREAKDOWN</Text>

                                        {/* Main Macros Grid */}
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 }}>
                                            <View style={{ alignItems: 'center' }}>
                                                <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>{analysisResult.macronutrients?.calories ?? analysisResult.scan?.total?.calories} kcal</Text>
                                                <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>Total Cal</Text>
                                            </View>
                                            <View style={{ alignItems: 'center' }}>
                                                <Text style={{ color: '#00C851', fontSize: 18, fontWeight: 'bold' }}>{analysisResult.macronutrients?.protein ?? analysisResult.scan?.total?.protein}g</Text>
                                                <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>Protein</Text>
                                            </View>
                                            <View style={{ alignItems: 'center' }}>
                                                <Text style={{ color: '#33b5e5', fontSize: 18, fontWeight: 'bold' }}>{analysisResult.macronutrients?.carbs ?? analysisResult.scan?.total?.carbs}g</Text>
                                                <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>Carbs</Text>
                                            </View>
                                            <View style={{ alignItems: 'center' }}>
                                                <Text style={{ color: '#ffbb33', fontSize: 18, fontWeight: 'bold' }}>{analysisResult.macronutrients?.fat ?? analysisResult.scan?.total?.fat}g</Text>
                                                <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>Fat</Text>
                                            </View>
                                        </View>

                                        {/* Extra Data (if available) */}
                                        {analysisResult.macronutrients?.fiber && (
                                            <View style={{ borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', paddingTop: 15 }}>
                                                <Text style={{ color: COLORS.textSecondary, marginBottom: 5 }}>Detailed Nutrients:</Text>
                                                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                                                    <View style={{ backgroundColor: 'rgba(255,255,255,0.05)', padding: 8, borderRadius: 8 }}>
                                                        <Text style={{ color: 'white', fontSize: 12 }}>💊 Zinc: {analysisResult.micronutrients?.minerals?.zinc || '11mg'}</Text>
                                                    </View>
                                                    {analysisResult.macronutrients.sugar && (
                                                        <View style={{ backgroundColor: 'rgba(255,255,255,0.05)', padding: 8, borderRadius: 8 }}>
                                                            <Text style={{ color: 'white', fontSize: 12 }}>🍬 Sugar: {analysisResult.macronutrients.sugar}g</Text>
                                                        </View>
                                                    )}
                                                    {analysisResult.macronutrients.essentials?.map((item, idx) => (
                                                        <View key={idx} style={{ backgroundColor: 'rgba(255,255,255,0.05)', padding: 8, borderRadius: 8 }}>
                                                            <Text style={{ color: 'white', fontSize: 12 }}>💊 {item}</Text>
                                                        </View>
                                                    ))}
                                                </View>
                                            </View>
                                        )}
                                    </View>
                                )}

                                {/* RAW ANALYSIS (Fallback) */}
                                {!analysisResult.verdict?.reasoning && (
                                    <Text style={{ color: 'white', fontSize: 18, lineHeight: 28 }}>{analysisResult.analysis}</Text>
                                )}
                            </>
                        )}
                    </ScrollView>
                </View>
            </Modal>
        </View>
    );
};

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function HomeStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: COLORS.background } }}>
            <Stack.Screen name="Recipes" component={RecipesScreen} />
            <Stack.Screen name="RecipeDetail" component={RecipeDetailScreen} />
        </Stack.Navigator>
    );
}

// Main Component that uses Context
const MainAppContent = () => {
    const context = useContext(AppContext);
    const { user, saveUser, isAuthLoading } = context || {};

    // Loading State
    if (isAuthLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' }}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={{ color: COLORS.primary, marginTop: 20, fontSize: 16 }}>Loading GymMeals...</Text>
            </View>
        );
    }

    // Auth Screen (Guest or Login)
    if (!user) {
        // Safe handler
        const handleSignIn = (userData) => {
            if (saveUser) {
                saveUser(userData);
            } else {
                console.error("Critical: saveUser function missing from context");
            }
        };

        return (
            <SafeAreaProvider>
                <AuthScreen onSignIn={handleSignIn} />
            </SafeAreaProvider>
        );
    }

    // Main App UI
    return (
        <ErrorBoundary>
            <SafeAreaProvider>
                <NavigationContainer theme={THEME} ref={navigationRef}>
                    <Tab.Navigator
                        screenOptions={{
                            headerShown: false,
                            tabBarStyle: styles.tabBar,
                            tabBarActiveTintColor: COLORS.primary,
                            tabBarInactiveTintColor: COLORS.textSecondary,
                            tabBarShowLabel: false,
                        }}
                    >
                        <Tab.Screen name="HomeTab" component={HomeStack} options={{ tabBarIcon: ({ color }) => <MaterialCommunityIcons name="chef-hat" size={28} color={color} /> }} />
                        <Tab.Screen name="Coach" component={CoachScreen} options={{ tabBarIcon: ({ color }) => <MaterialCommunityIcons name="brain" size={28} color={color} /> }} />
                        <Tab.Screen name="Challenge" component={ChallengeScreen} options={{ tabBarIcon: ({ color }) => <MaterialCommunityIcons name="trophy-outline" size={28} color={color} /> }} />
                        <Tab.Screen name="Log" component={LogScreen} options={{ tabBarIcon: ({ color }) => <MaterialCommunityIcons name="notebook-edit-outline" size={28} color={color} /> }} />
                        <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: ({ color }) => <MaterialCommunityIcons name="account-circle" size={28} color={color} /> }} />
                    </Tab.Navigator>

                    {/* FLOATING GEMINI 3.0 ASSISTANT BUTTON */}
                    <TouchableOpacity
                        style={{
                            position: 'absolute',
                            bottom: 90,
                            right: 20,
                            backgroundColor: COLORS.primary,
                            width: 60,
                            height: 60,
                            borderRadius: 30,
                            justifyContent: 'center',
                            alignItems: 'center',
                            display: 'flex',
                            elevation: 10,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.3,
                            shadowRadius: 4,
                            zIndex: 9999
                        }}
                        onPress={() => {
                            Alert.alert(
                                '🤖 Gemini 3.0 Coach',
                                'What would you like to do?',
                                [
                                    { text: 'Analyze Food Photo', onPress: () => navigationRef.current?.navigate('Coach') },
                                    {
                                        text: 'Get Personalized Meal Plan',
                                        onPress: () => {
                                            Alert.alert(
                                                '🍽️ Gemini 3.0 Meal Plan',
                                                'To get your personalized meal plan:\n\n1. Set your profile (height, weight, goal)\n2. Go to Coach tab\n3. Scroll down to "Generate Meal Plan"\n\nGemini 3.0 will create a custom plan based on your goals!',
                                                [{ text: 'Got it!' }]
                                            );
                                        }
                                    },
                                    { text: 'Browse Recipes', onPress: () => navigationRef.current?.navigate('HomeTab', { screen: 'Recipes' }) },
                                    { text: 'Cancel', style: 'cancel' }
                                ],
                                { cancelable: true }
                            );
                        }}
                    >
                        <MaterialCommunityIcons name="robot-excited" size={32} color="black" />
                    </TouchableOpacity>
                </NavigationContainer>
            </SafeAreaProvider>
        </ErrorBoundary>
    );
};

// Root App Component
export default function App() {
    return (
        <AppProvider>
            <MainAppContent />
        </AppProvider>
    );
}

registerRootComponent(App);


const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { padding: 20, paddingTop: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerTitle: { fontSize: 32, fontWeight: '900', color: COLORS.text, letterSpacing: -1 },
    headerSubtitle: { fontSize: 16, color: COLORS.textSecondary, marginTop: -5 },
    listContent: { padding: 20, paddingTop: 0 },
    card: { height: 250, borderRadius: 24, marginBottom: 20, overflow: 'hidden', backgroundColor: COLORS.card, elevation: 10 },
    cardImage: { ...StyleSheet.absoluteFillObject, width: undefined, height: undefined },
    cardOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
    cardContent: { flex: 1, justifyContent: 'flex-end', padding: 20 },
    cardMeta: { flexDirection: 'row', marginBottom: 10 },
    badge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, marginRight: 8, backdropFilter: 'blur(10px)' },
    badgePrimary: { backgroundColor: COLORS.primary },
    badgeText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
    badgeTextPrimary: { color: 'black', fontWeight: 'bold', fontSize: 12 },
    cardTitle: { fontSize: 24, fontWeight: '800', color: 'white' },
    cardSubtitle: { fontSize: 14, color: COLORS.primary, fontWeight: '700', marginTop: 4 },

    detailImageContainer: { height: 350, position: 'relative' },
    detailImage: { ...StyleSheet.absoluteFillObject },
    detailOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'linear-gradient(to bottom, transparent, #121212)' },
    backButton: { position: 'absolute', top: 50, left: 20, width: 40, height: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20 },
    detailContent: { padding: 24, marginTop: -30, borderTopLeftRadius: 30, borderTopRightRadius: 30, backgroundColor: COLORS.background },
    detailTitle: { fontSize: 32, fontWeight: '900', color: 'white', marginBottom: 10 },
    detailDesc: { fontSize: 16, color: COLORS.textSecondary, lineHeight: 24, marginBottom: 24 },
    statsRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: COLORS.card, padding: 20, borderRadius: 20, marginBottom: 30 },
    statBox: { alignItems: 'center', flex: 1 },
    statValue: { fontSize: 18, fontWeight: 'bold', color: 'white', marginTop: 5 },
    statLabel: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
    sectionTitle: { fontSize: 20, fontWeight: 'bold', color: 'white', marginBottom: 15, marginTop: 10 },
    ingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: COLORS.secondary },
    bullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.primary, marginRight: 15 },
    ingName: { flex: 1, color: 'white', fontSize: 16 },
    ingQty: { color: COLORS.primary, fontWeight: 'bold' },

    mainButton: { backgroundColor: COLORS.primary, borderRadius: 16, padding: 20, alignItems: 'center', marginVertical: 30, shadowColor: COLORS.primary, shadowOpacity: 0.3, shadowRadius: 10 },
    mainButtonText: { color: 'black', fontWeight: '900', fontSize: 16, letterSpacing: 1 },

    stepRow: { flexDirection: 'row', marginBottom: 20 },
    stepCircle: { width: 30, height: 30, borderRadius: 15, backgroundColor: COLORS.card, alignItems: 'center', justifyContent: 'center', marginRight: 15 },
    stepIndex: { color: COLORS.primary, fontWeight: 'bold' },
    stepText: { flex: 1, color: COLORS.textSecondary, fontSize: 16, lineHeight: 24 },

    tabBar: { backgroundColor: COLORS.background, borderTopColor: COLORS.secondary, height: 60, paddingBottom: 5 },

    emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100 },
    emptyText: { color: 'white', fontSize: 20, fontWeight: 'bold', marginTop: 20 },
    emptySub: { color: COLORS.textSecondary, marginTop: 10, width: '70%', textAlign: 'center' },

    listHeader: { color: COLORS.primary, fontSize: 14, fontWeight: 'bold', marginBottom: 10, marginTop: 20 },
    listItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, padding: 16, borderRadius: 12, marginBottom: 8 },
    listItemChecked: { opacity: 0.5 },
    listItemText: { flex: 1, color: 'white', fontSize: 16, marginLeft: 12 },
    textStrike: { textDecorationLine: 'line-through', color: COLORS.textSecondary },
    listItemQty: { color: COLORS.textSecondary },

    // Profile & Coach Styles
    formContainer: { padding: 20 },
    inputGroup: { marginBottom: 20 },
    label: { color: COLORS.text, fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
    input: { backgroundColor: COLORS.card, color: COLORS.text, padding: 15, borderRadius: 12, fontSize: 16 },
    radioGroup: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 },
    radioButton: { flexDirection: 'row', alignItems: 'center', marginRight: 15, marginBottom: 10 },
    radioSelected: { width: 20, height: 20, borderRadius: 10, backgroundColor: COLORS.primary, marginRight: 8 },
    radioUnselected: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: COLORS.textSecondary, marginRight: 8 },
    radioText: { color: COLORS.text, fontSize: 14 },
    macroCard: { backgroundColor: COLORS.card, padding: 20, borderRadius: 16, marginTop: 30 },
    macroTitle: { color: COLORS.text, fontSize: 18, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
    macroRow: { flexDirection: 'row', justifyContent: 'space-around' },
    macroItem: { alignItems: 'center' },
    macroValue: { color: COLORS.primary, fontSize: 24, fontWeight: 'bold', marginTop: 10 },
    macroLabel: { color: COLORS.textSecondary, fontSize: 12, marginTop: 5 },
    warningCard: { flexDirection: 'row', backgroundColor: COLORS.card, padding: 16, margin: 20, borderRadius: 12, alignItems: 'center' },
    warningText: { flex: 1, color: COLORS.textSecondary, fontSize: 14, marginLeft: 12 },
    questionGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 30 },
    questionCard: { backgroundColor: COLORS.card, padding: 16, borderRadius: 12, minWidth: '45%', alignItems: 'center', marginRight: 10, marginBottom: 10 },
    questionCardActive: { backgroundColor: COLORS.primary },
    questionText: { fontSize: 14, fontWeight: 'bold', color: COLORS.text },
    recommendCard: { flexDirection: 'row', backgroundColor: COLORS.card, borderRadius: 16, marginBottom: 16, overflow: 'hidden' },
    recommendImage: { width: 100, height: 100 },
    recommendContent: { flex: 1, padding: 12 },
    recommendTitle: { color: COLORS.text, fontSize: 16, fontWeight: 'bold' },
    recommendDesc: { color: COLORS.textSecondary, fontSize: 12, marginTop: 4 },
    recommendMeta: { flexDirection: 'row', marginTop: 8 },
    recommendMetaText: { color: COLORS.primary, fontSize: 12, fontWeight: 'bold', marginRight: 8 },
    recommendReason: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
    recommendReasonText: { color: COLORS.primary, fontSize: 11, marginLeft: 4 },

    // Apple Sign In Styles
    appleButton: { width: '100%', height: 50, marginBottom: 20 },
    appleCard: { backgroundColor: COLORS.card, borderRadius: 16, padding: 16, marginBottom: 20 },
    appleCardHeader: { flexDirection: 'row', alignItems: 'center' },
    appleCardTitle: { color: COLORS.text, fontSize: 16, fontWeight: 'bold' },
    appleCardEmail: { color: COLORS.textSecondary, fontSize: 12, marginTop: 4 },
    appleSignOutBtn: { backgroundColor: COLORS.secondary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
    appleSignOutText: { color: COLORS.text, fontSize: 12, fontWeight: 'bold' },

    // Challenge Styles
    streakCard: { backgroundColor: COLORS.card, padding: 30, borderRadius: 20, alignItems: 'center', marginBottom: 20 },
    streakNumber: { color: COLORS.primary, fontSize: 36, fontWeight: '900', marginTop: 15 },
    streakLabel: { color: COLORS.textSecondary, fontSize: 14, marginTop: 5 },
    progressBar: { width: '100%', height: 8, backgroundColor: COLORS.secondary, borderRadius: 4, marginTop: 20, overflow: 'hidden' },
    progressFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 4 },
    motivationCard: { flexDirection: 'column', backgroundColor: COLORS.card, padding: 16, borderRadius: 12, alignItems: 'flex-start', marginBottom: 30 },
    motivationText: { color: COLORS.text, fontSize: 16, lineHeight: 24, fontWeight: 'bold', marginTop: 10, textAlign: 'left', flex: 1, flexWrap: 'wrap', paddingRight: 10 },
    challengeGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    challengeBox: { width: '12%', aspectRatio: 1, backgroundColor: COLORS.secondary, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
    challengeBoxComplete: { backgroundColor: COLORS.success },
    challengeBoxText: { color: COLORS.text, fontSize: 12, fontWeight: 'bold' },
    resetButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, marginTop: 20, borderRadius: 12, backgroundColor: COLORS.card },
    resetButtonText: { color: COLORS.textSecondary, fontSize: 14, fontWeight: 'bold', marginLeft: 8 },

    // Log Screen Styles
    logWrapCard: { backgroundColor: COLORS.card, padding: 20, borderRadius: 16, marginBottom: 20 },
    logTitle: { color: COLORS.text, fontSize: 18, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
    logRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    logStat: { alignItems: 'center', flex: 1 },
    logValue: { color: COLORS.text, fontSize: 20, fontWeight: '900' },
    logLabel: { color: COLORS.textSecondary, fontSize: 12, marginTop: 4 },
    logOp: { color: COLORS.textSecondary, fontSize: 20, fontWeight: 'bold' },
    logFooter: { color: COLORS.textSecondary, fontSize: 12, textAlign: 'center', marginTop: 15 },
    addCard: { backgroundColor: COLORS.card, padding: 16, borderRadius: 16, marginBottom: 20 },
    addButton: { backgroundColor: COLORS.primary, width: 50, height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    hintText: { color: COLORS.textSecondary, fontSize: 11, marginTop: 8, fontStyle: 'italic' },
    logItem: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: COLORS.card, padding: 16, borderRadius: 12, marginBottom: 8 },
    logItemName: { color: COLORS.text, fontSize: 15, fontWeight: '600' },
    logItemCal: { color: COLORS.primary, fontSize: 15, fontWeight: '700' },

    // Food Suggestions Dropdown
    foodSuggestions: { backgroundColor: COLORS.card, borderRadius: 12, marginTop: 10, overflow: 'hidden' },
    suggestionItem: { padding: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
    suggestionName: { color: COLORS.text, fontSize: 15, fontWeight: '600', marginBottom: 4 },
    suggestionMacros: { color: COLORS.textSecondary, fontSize: 13 },

    // Custom Recipe Modal
    modalContent: { flex: 1, padding: 20 },
    submitButton: { backgroundColor: COLORS.primary, padding: 18, borderRadius: 16, alignItems: 'center' },
    submitButtonText: { color: 'black', fontSize: 18, fontWeight: '800' },
});

registerRootComponent(App);
