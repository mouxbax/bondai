# BondAI Avatar UI - Comprehensive Technical Specification

**Project:** BondAI - AI Companion App Fighting Loneliness  
**Goal:** Transform chat-based UI into futuristic avatar-based companion experience  
**Vision Year:** 2036-style AI life companion on your phone  
**Date:** 2026-04-08

---

## 1. Vision & User Experience

### Core Interaction Model
When a user opens BondAI, they see a **3D human-like avatar** ready to talk-not a chat interface. This is a **voice-first, emotion-responsive companion** experience.

**Key Characteristics:**
- **Presence:** Full-screen or near-full-screen 3D avatar that feels alive and responsive
- **Voice-First:** Primary interaction via microphone; keyboard is secondary fallback
- **Emotional Intelligence:** Avatar expresses emotions through facial expressions and subtle body language
- **Lifelike Speech:** Avatar lips move, eyes blink, head tilts-synchronized with speech and user input
- **Always Listening:** Avatar is present and attentive, ready for the next conversation
- **Ambient Presence:** Soft particles, glow effects, breathing animations when idle

### User Journey
1. Open app → See animated avatar in calm, ambient space
2. Press large glowing mic button → Avatar tilts head, listening animation activates
3. Speak your feelings/thoughts → STT transcribes in real-time
4. Avatar responds with voice → Lips sync, facial expressions match emotion, subtle hand gestures
5. Swipe up → Access chat history, goals, coaching scenarios (secondary features)
6. Settings gear → Customize avatar look, language, subscription

---

## 2. Technical Architecture

### 2.1 3D Avatar Rendering

#### Stack
- **React Three Fiber** (`@react-three/fiber`, `@react-three/drei`) - React abstraction for Three.js
- **Three.js** (`three`) - 3D rendering engine
- **Babylon.js** (optional) - Alternative if Three.js feels limiting for complex animations

#### Avatar Model Sourcing
**Option A: Ready Player Me (Recommended)**
- Free API: Generate customizable 3D avatars
- Users create their companion's look via Ready Player Me web interface
- Export as GLB/GLTF with morph targets for facial expressions
- Endpoint: `https://api.readyplayer.me/{userId}.glb`
- Includes pre-rigged humanoid body + facial morph targets

**Option B: Mixamo/Sketchfab Free Models**
- Pre-built GLB models with animations
- Lower fidelity but faster to integrate
- Requires manual setup of morph targets for expressions

**Option C: Custom GLB Model**
- Highest control, highest effort
- Requires 3D artist or Blender skills

**Recommendation:** Start with Ready Player Me for MVP, allow custom avatars later.

#### Model Requirements
The avatar model **must include:**
- Facial morph targets: `viseme_PP`, `viseme_FF`, `viseme_TH`, `viseme_DD`, `viseme_kk`, `viseme_CH`, `viseme_SS`, `viseme_AA`, `viseme_OO`, `viseme_E`, `viseme_I`, `viseme_O`, `viseme_U` (standard viseme set)
- Expression morph targets: `expression_happy`, `expression_sad`, `expression_angry`, `expression_surprised`, `expression_neutral`, `expression_anxious`
- Rig with bones for idle animations (spine, head, eyes)

---

### 2.2 Speech Synthesis & Lip Sync

#### Text-to-Speech (TTS)
- **Use Web Speech API** (`SpeechSynthesisUtterance`) for simplicity, or
- **Elevenlabs API** / **Google Cloud TTS** for higher quality voices with emotion tags

**Recommended Flow:**
```
AI Response → Apply emotion tag → Generate TTS with appropriate voice tone → Extract phoneme timing
```

#### Lip Sync Strategy: Viseme Mapping
Synchronize avatar mouth movements with speech by mapping phonemes to visemes.

**Process:**
1. During TTS playback, extract speech timing/phoneme data
2. Map phonemes to standard viseme targets (see list above)
3. Update morph target weights in real-time as audio plays
4. Timing accuracy: ±50ms is acceptable for natural appearance

**Implementation Detail:**
```javascript
// Simplified viseme mapping
const PHONEME_TO_VISEME = {
  'p': 'viseme_PP',   // /p/ /b/ /m/
  'f': 'viseme_FF',   // /f/ /v/
  'th': 'viseme_TH',  // /θ/ /ð/
  'd': 'viseme_DD',   // /d/ /t/ /n/
  'k': 'viseme_kk',   // /k/ /g/ /ŋ/
  'ch': 'viseme_CH',  // /tʃ/ /dʒ/
  's': 'viseme_SS',   // /s/ /z/ /ʃ/
  'aa': 'viseme_AA',  // /a/ /ɑ/
  'oo': 'viseme_OO',  // /o/ /u/ /w/
  'e': 'viseme_E',    // /ɛ/ /e/
  'i': 'viseme_I',    // /ɪ/ /i/
  'o': 'viseme_O',    // /ɔ/
  'u': 'viseme_U',    // /ʌ/
};
```

**Timing Source Options:**
- **Web Audio API:** Analyze audio playback position + phoneme boundaries
- **Elevenlabs Streaming:** Returns phoneme timestamps in real-time
- **Fallback:** Time-based approximation using speech rate

---

### 2.3 Emotion-Reactive Expressions

#### Emotion Mapping
Map existing `EmotionTag` enum (HAPPY, SAD, ANXIOUS, LONELY, ANGRY, NEUTRAL) to morph target weights.

**Expression Profiles:**
```javascript
const EMOTION_EXPRESSIONS = {
  HAPPY: {
    expression_happy: 1.0,
    expression_sad: 0.0,
    expression_angry: 0.0,
    expression_anxious: 0.0,
  },
  SAD: {
    expression_happy: 0.0,
    expression_sad: 1.0,
    expression_angry: 0.0,
    expression_anxious: 0.2,
  },
  ANXIOUS: {
    expression_happy: 0.0,
    expression_sad: 0.1,
    expression_angry: 0.0,
    expression_anxious: 1.0,
  },
  LONELY: {
    expression_happy: 0.0,
    expression_sad: 0.8,
    expression_angry: 0.0,
    expression_anxious: 0.3,
  },
  ANGRY: {
    expression_happy: 0.0,
    expression_sad: 0.0,
    expression_angry: 1.0,
    expression_anxious: 0.5,
  },
  NEUTRAL: {
    expression_happy: 0.0,
    expression_sad: 0.0,
    expression_angry: 0.0,
    expression_anxious: 0.0,
  },
};
```

**Implementation:**
- Extract emotion from AI response (already exists in your system)
- Smoothly transition morph target weights over 500ms using Gsap or Tween.js
- Layer emotions: primary + subtle secondary emotions for nuance

---

### 2.4 Idle & Contextual Animations

#### Animation Categories

**1. Breathing (Always Running)**
- Subtle chest expansion/contraction
- ~4-second cycle
- Creates sense of presence

**2. Eye Blinks**
- Random blinks every 3–7 seconds
- 150ms blink duration
- Prevent staring feeling

**3. Head Micro-Movements**
- Slight head tilt while idle
- Gentle head bob while listening
- More animated head movement while speaking (emphasis)

**4. Listening Animation** (when user is speaking)
- Head tilts toward microphone
- Eyes widen slightly (interest)
- Body leans forward subtly

**5. Speaking Animation** (when AI is speaking)
- Hand gestures (wave hands gently to emphasize points)
- Posture shifts for natural dialogue
- Eye contact (gaze at "camera")

#### Implementation with Three.js AnimationMixer
```javascript
// Load model with animations from GLTF
const { animations, scene } = await gltfLoader.loadAsync(modelUrl);
const mixer = new THREE.AnimationMixer(scene);

// Breathing animation (looping)
const breathingClip = THREE.AnimationClip.CreateFromMorphTargetSequence(
  'breathing',
  morphTargetList,
  30 // fps
);
mixer.clipAction(breathingClip).play();

// Blink animation (triggered randomly)
const blinkAction = mixer.clipAction(blinkClip);
setInterval(() => {
  blinkAction.reset().play();
}, Math.random() * 4000 + 3000);

// Update in render loop
const delta = clock.getDelta();
mixer.update(delta);
```

---

### 2.5 Web Speech API Integration

#### Speech-to-Text (STT)
```javascript
const recognition = new webkitSpeechRecognition() || new SpeechRecognition();
recognition.continuous = false;
recognition.interimResults = true;
recognition.lang = userLanguage; // 'en-US', 'fr-FR', etc.

recognition.onstart = () => {
  setIsListening(true);
  triggerListeningAnimation();
};

recognition.onresult = (event) => {
  let interimTranscript = '';
  for (let i = event.resultIndex; i < event.results.length; i++) {
    const transcript = event.results[i][0].transcript;
    if (event.results[i].isFinal) {
      setFinalTranscript(transcript);
    } else {
      interimTranscript += transcript;
    }
  }
  setInterimTranscript(interimTranscript);
};

recognition.onend = () => {
  setIsListening(false);
  triggerIdleAnimation();
};

recognition.start();
```

#### Text-to-Speech (TTS)
```javascript
const utterance = new SpeechSynthesisUtterance(text);
utterance.lang = userLanguage;
utterance.rate = 0.95; // Slightly slower for clarity
utterance.pitch = 1.0;
utterance.volume = 1.0;

utterance.onstart = () => {
  setIsAISpeaking(true);
  triggerSpeakingAnimation();
};

utterance.onend = () => {
  setIsAISpeaking(false);
  triggerIdleAnimation();
};

speechSynthesis.speak(utterance);
```

---

## 3. Multi-Language Support (i18n)

### Language Scope
- **Launch Languages:** English, French
- **Future:** Spanish, German, Mandarin, etc.

### Implementation: next-intl or Custom JSON

#### Option A: Using next-intl
```bash
npm install next-intl
```

**Routing Setup (app router):**
```
app/
  [locale]/
    (app)/
      companion/page.tsx
      settings/page.tsx
    api/
      ...
```

**Locale Files:**
```json
// locales/en.json
{
  "companion": {
    "listen_prompt": "How are you feeling today?",
    "speaking": "Speaking...",
    "listening": "Listening...",
    "streak": "Streak: {count} days",
    "connection_score": "Connection: {score}%"
  },
  "settings": {
    "language": "Language",
    "avatar_customization": "Customize Your Companion",
    "subscription": "Subscription"
  },
  "pricing": {
    "free": "Free",
    "plus": "Plus",
    "care_plus": "Care+"
  }
}

// locales/fr.json
{
  "companion": {
    "listen_prompt": "Comment vous sentez-vous aujourd'hui?",
    "speaking": "En train de parler...",
    "listening": "À l'écoute...",
    "streak": "Série: {count} jours",
    "connection_score": "Connexion: {score}%"
  }
  // ... etc
}
```

#### Language Detection & Switching
```typescript
// lib/i18n.ts
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';

export const useLanguage = () => {
  const locale = useLocale();
  const router = useRouter();
  
  const setLanguage = (newLocale: string) => {
    // Update user preference in Supabase
    updateUserLanguage(newLocale);
    // Redirect to new locale path
    router.push(`/${newLocale}/companion`);
  };
  
  return { currentLanguage: locale, setLanguage };
};
```

#### Voice & AI Language Binding
```typescript
// Set STT language based on user preference
const userLanguage = userPreferences.language; // 'en' or 'fr'
const langCode = userLanguage === 'fr' ? 'fr-FR' : 'en-US';

recognition.lang = langCode;
utterance.lang = langCode;

// AI should respond in same language
// Include in system prompt: "Respond in {userLanguage}"
```

---

## 4. Payments & Subscription Model

### Tiers

| Tier      | Price    | Check-ins | Voice | Coaching | Avatar | Priority | Family |
|-----------|----------|-----------|-------|----------|--------|----------|--------|
| Free      | -        | 3/week    | ✗     | ✗        | 1      | ✗        | ✗      |
| Plus      | $9/mo    | Unlimited | ✓     | ✓        | 3      | ✗        | ✗      |
| Care+     | $19/mo   | Unlimited | ✓     | ✓        | 10     | ✓        | ✓      |

### Stripe Integration

#### Prisma Schema
```prisma
model Subscription {
  id                    String      @id @default(cuid())
  userId                String      @unique
  user                  User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  stripeCustomerId      String      @unique
  stripePriceId         String
  stripeSubscriptionId  String      @unique
  stripeCurrentPeriodEnd DateTime
  
  status                String      // 'active', 'past_due', 'canceled', 'trialing'
  tier                  String      // 'free', 'plus', 'care_plus'
  
  trialStart            DateTime?
  trialEnd              DateTime?
  currentPeriodStart    DateTime
  currentPeriodEnd      DateTime
  
  canceledAt            DateTime?
  
  createdAt             DateTime    @default(now())
  updatedAt             DateTime    @updatedAt
}
```

#### API Routes

**1. Create Checkout Session**
```typescript
// app/api/stripe/checkout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth } from '@/auth';
import { db } from '@/db';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { priceId, tier } = await req.json();

  try {
    // Get or create Stripe customer
    let customer = await db.subscription.findUnique({
      where: { userId: session.user.id },
    });

    let stripeCustomerId = customer?.stripeCustomerId;
    if (!stripeCustomerId) {
      const stripeCustomer = await stripe.customers.create({
        email: session.user.email!,
        metadata: { userId: session.user.id },
      });
      stripeCustomerId = stripeCustomer.id;
    }

    // Create checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/subscribe/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/subscribe/cancel`,
      subscription_data: {
        trial_period_days: 7, // 7-day free trial
      },
    });

    return NextResponse.json({ sessionId: checkoutSession.id });
  } catch (error) {
    console.error('Stripe error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
```

**2. Stripe Webhook Handler**
```typescript
// app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/db';
import { headers } from 'next/headers';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const headersList = headers();
  const signature = headersList.get('stripe-signature')!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId || '';

        const priceId = (subscription.items.data[0]?.price.id) || '';
        const tierMap: Record<string, string> = {
          [process.env.STRIPE_PRICE_ID_PLUS!]: 'plus',
          [process.env.STRIPE_PRICE_ID_CARE_PLUS!]: 'care_plus',
        };
        const tier = tierMap[priceId] || 'free';

        await db.subscription.upsert({
          where: { userId },
          create: {
            userId,
            stripeCustomerId: subscription.customer as string,
            stripePriceId: priceId,
            stripeSubscriptionId: subscription.id,
            tier,
            status: subscription.status,
            trialStart: subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
            trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          },
          update: {
            stripeSubscriptionId: subscription.id,
            stripePriceId: priceId,
            tier,
            status: subscription.status,
            trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          },
        });
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId || '';

        await db.subscription.update({
          where: { userId },
          data: {
            status: 'canceled',
            canceledAt: new Date(),
            tier: 'free',
          },
        });
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;

        await db.subscription.update({
          where: { stripeSubscriptionId: subscriptionId },
          data: { status: 'past_due' },
        });
        break;
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
```

**3. Customer Portal Redirect**
```typescript
// app/api/stripe/portal/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth } from '@/auth';
import { db } from '@/db';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const subscription = await db.subscription.findUnique({
      where: { userId: session.user.id },
    });

    if (!subscription?.stripeCustomerId) {
      return NextResponse.json(
        { error: 'No subscription found' },
        { status: 404 }
      );
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/settings`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error('Portal error:', error);
    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 }
    );
  }
}
```

#### Trial Logic (Frontend)
```typescript
// hooks/useSubscription.ts
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

export const useSubscription = () => {
  const { data: session } = useSession();
  const [subscription, setSubscription] = useState(null);
  const [daysLeftInTrial, setDaysLeftInTrial] = useState(0);
  const [isTrialActive, setIsTrialActive] = useState(false);

  useEffect(() => {
    if (!session?.user?.id) return;

    fetch('/api/subscription/check')
      .then((res) => res.json())
      .then((data) => {
        setSubscription(data);
        
        if (data.status === 'trialing' && data.trialEnd) {
          const now = new Date();
          const trialEnd = new Date(data.trialEnd);
          const daysLeft = Math.ceil(
            (trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          );
          setDaysLeftInTrial(Math.max(0, daysLeft));
          setIsTrialActive(daysLeft > 0);
        }
      });
  }, [session]);

  return { subscription, daysLeftInTrial, isTrialActive };
};
```

---

## 5. File & Directory Structure

### New Directory Layout
```
app/
  [locale]/
    (app)/
      companion/
        page.tsx                 # Main avatar view (default landing)
      settings/
        page.tsx                 # Language, avatar customization, subscription
      subscribe/
        page.tsx                 # Pricing/paywall
        success/page.tsx
        cancel/page.tsx
    api/
      stripe/
        checkout/route.ts
        webhook/route.ts
        portal/route.ts
      subscription/
        check/route.ts           # GET current user subscription
      avatar/
        customize/route.ts       # POST avatar customization (Ready Player Me)

components/
  avatar/
    AvatarScene.tsx              # Three.js canvas wrapper + setup
    AvatarModel.tsx              # GLTF model loader, animation mixer
    AvatarExpressions.tsx        # Emotion → morph target logic
    LipSync.tsx                  # Viseme timing + application
    IdleAnimations.tsx           # Breathing, blinks, micro-movements
    EyeAnimation.tsx             # Eye tracking & blinking logic

  companion/
    CompanionView.tsx            # Full-screen layout + orchestration
    MicButton.tsx                # Large circular mic button + pulse
    SubtitleOverlay.tsx          # Floating text showing AI speech + interim transcription
    StatusBar.tsx                # Top: streak, connection score, settings icon
    BottomDrawer.tsx             # Swipe-up panel for chat history, goals, coaching
    ListeningIndicator.tsx       # Visual feedback while listening
    SpeakingIndicator.tsx        # Visual feedback while AI speaks

  payments/
    PricingCards.tsx             # 3-tier pricing display
    TrialBanner.tsx              # "X days left in trial" + upgrade prompt
    PaywallModal.tsx             # Shown when free user hits check-in limit
    SubscriptionManager.tsx      # Portal link, cancel, downgrade

  shared/
    Avatar3D.tsx                 # Reusable avatar component

lib/
  i18n.ts                        # Language detection, string lookup
  stripe.ts                      # Stripe client config, helpers
  speech.ts                      # STT/TTS utilities
  animations.ts                  # Shared animation helpers (Gsap, etc.)
  readyplayerme.ts              # Ready Player Me API integration
  emotion.ts                     # Emotion → expression mapping

locales/
  en.json                        # English UI strings
  fr.json                        # French UI strings

public/
  avatars/                       # (Optional) Pre-built avatar GLB files
  sounds/                        # (Optional) UI feedback sounds

prisma/
  schema.prisma                  # Includes Subscription model (above)
```

---

## 6. Component Deep Dives

### 6.1 AvatarScene Component
```typescript
// components/avatar/AvatarScene.tsx
'use client';

import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera, Environment, Float } from '@react-three/drei';
import * as THREE from 'three';
import AvatarModel from './AvatarModel';

interface AvatarSceneProps {
  avatarUrl: string;
  emotion: 'HAPPY' | 'SAD' | 'ANXIOUS' | 'LONELY' | 'ANGRY' | 'NEUTRAL';
  isListening: boolean;
  isSpeaking: boolean;
  onExpressionChange?: (expression: string) => void;
}

export default function AvatarScene({
  avatarUrl,
  emotion,
  isListening,
  isSpeaking,
  onExpressionChange,
}: AvatarSceneProps) {
  return (
    <Canvas
      camera={{ position: [0, 1.6, 2.5], fov: 50 }}
      style={{ width: '100%', height: '100%' }}
      gl={{ alpha: true, antialias: true }}
    >
      {/* Lighting */}
      <ambientLight intensity={0.7} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      <directionalLight position={[-5, 3, -5]} intensity={0.5} />
      
      {/* Background environment */}
      <Environment preset="studio" />

      {/* Floating avatar */}
      <Float
        speed={1.5}
        rotationIntensity={0.2}
        floatIntensity={0.2}
      >
        <AvatarModel
          url={avatarUrl}
          emotion={emotion}
          isListening={isListening}
          isSpeaking={isSpeaking}
          onExpressionChange={onExpressionChange}
        />
      </Float>

      {/* Camera */}
      <PerspectiveCamera makeDefault position={[0, 1.6, 2.5]} />

      {/* Particles in background (optional) */}
      <ParticleBackground />
    </Canvas>
  );
}

function ParticleBackground() {
  const pointsRef = useRef<THREE.Points>(null);

  useEffect(() => {
    const particleCount = 100;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 10;
      positions[i + 1] = (Math.random() - 0.5) * 10;
      positions[i + 2] = (Math.random() - 0.5) * 10;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    return () => geometry.dispose();
  }, []);

  useFrame(() => {
    if (pointsRef.current) {
      pointsRef.current.rotation.x += 0.0001;
      pointsRef.current.rotation.y += 0.0001;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry />
      <pointsMaterial size={0.02} sizeAttenuation color="#1D9E75" />
    </points>
  );
}
```

### 6.2 AvatarModel Component with Animations
```typescript
// components/avatar/AvatarModel.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { EMOTION_EXPRESSIONS } from '@/lib/emotion';
import gsap from 'gsap';

interface AvatarModelProps {
  url: string;
  emotion: string;
  isListening: boolean;
  isSpeaking: boolean;
  onExpressionChange?: (expression: string) => void;
}

export default function AvatarModel({
  url,
  emotion,
  isListening,
  isSpeaking,
  onExpressionChange,
}: AvatarModelProps) {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(url);
  const { actions } = useAnimations(animations, group);
  const [currentEmotion, setCurrentEmotion] = useState(emotion);
  const morphTargetInfluencesRef = useRef<Record<string, number>>({});

  // Initialize morph targets
  useEffect(() => {
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh && child.morphTargetInfluences) {
        child.morphTargetInfluences.forEach((_, idx) => {
          const targetName = child.morphTargetDictionary?.[idx] || `target_${idx}`;
          morphTargetInfluencesRef.current[targetName] = 0;
        });
      }
    });
  }, [scene]);

  // Play idle animation
  useEffect(() => {
    if (actions && Object.keys(actions).length > 0) {
      const idleAction = actions['Idle'] || Object.values(actions)[0];
      if (idleAction) {
        idleAction.play();
      }
    }
  }, [actions]);

  // Update emotion expressions
  useEffect(() => {
    const emotionConfig = EMOTION_EXPRESSIONS[emotion] || EMOTION_EXPRESSIONS.NEUTRAL;

    scene.traverse((child) => {
      if (child instanceof THREE.Mesh && child.morphTargetInfluences) {
        Object.entries(emotionConfig).forEach(([targetName, influence]) => {
          const index = child.morphTargetDictionary?.[targetName];
          if (index !== undefined) {
            gsap.to(child.morphTargetInfluences, {
              [index]: influence,
              duration: 0.5,
              ease: 'power2.inOut',
            });
          }
        });
      }
    });

    setCurrentEmotion(emotion);
    onExpressionChange?.(emotion);
  }, [emotion, scene, onExpressionChange]);

  // Listening animation
  useEffect(() => {
    if (isListening && group.current) {
      gsap.to(group.current.rotation, {
        y: 0.1,
        duration: 0.3,
        ease: 'power2.out',
      });
    } else if (group.current) {
      gsap.to(group.current.rotation, {
        y: 0,
        duration: 0.5,
        ease: 'power2.out',
      });
    }
  }, [isListening]);

  useFrame(() => {
    // Breathing animation (subtle scale)
    if (group.current && !isSpeaking) {
      const time = Date.now() * 0.001;
      group.current.scale.set(
        1 + Math.sin(time * 0.5) * 0.01,
        1 + Math.sin(time * 0.5) * 0.01,
        1
      );
    }
  });

  return <primitive ref={group} object={scene} />;
}

useGLTF.preload('/avatars/default.glb');
```

### 6.3 MicButton Component
```typescript
// components/companion/MicButton.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import styles from './MicButton.module.css';

interface MicButtonProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

export default function MicButton({ onTranscript, disabled = false }: MicButtonProps) {
  const { isListening, startListening, stopListening } = useAudioRecorder(onTranscript);
  const [isPulsing, setIsPulsing] = useState(false);

  useEffect(() => {
    setIsPulsing(isListening);
  }, [isListening]);

  const handleClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`${styles.micButton} ${isListening ? styles.active : ''} ${
        isPulsing ? styles.pulse : ''
      }`}
      aria-label={isListening ? 'Stop listening' : 'Start listening'}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path d="M12 1a3 3 0 0 0-3 3v12a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="23" />
        <line x1="8" y1="23" x2="16" y2="23" />
      </svg>
      {isListening && <span className={styles.pulse} />}
    </button>
  );
}
```

**Styles (MicButton.module.css):**
```css
.micButton {
  position: absolute;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #1d9e75 0%, #16a085 100%);
  border: none;
  color: white;
  cursor: pointer;
  font-size: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 32px rgba(29, 158, 117, 0.4);
  transition: all 0.3s ease;
  z-index: 20;
}

.micButton:hover:not(:disabled) {
  box-shadow: 0 12px 48px rgba(29, 158, 117, 0.6);
  transform: translateX(-50%) scale(1.08);
}

.micButton.active {
  background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
  box-shadow: 0 8px 32px rgba(231, 76, 60, 0.6);
}

.micButton.pulse::after {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 3px solid #1d9e75;
  animation: pulse 1.5s ease-out infinite;
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(1.4);
    opacity: 0;
  }
}

.micButton:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

### 6.4 SubtitleOverlay Component
```typescript
// components/companion/SubtitleOverlay.tsx
'use client';

import React, { useEffect, useState } from 'react';
import styles from './SubtitleOverlay.module.css';

interface SubtitleOverlayProps {
  aiText: string;
  userInterimText: string;
  isAISpeaking: boolean;
  isUserListening: boolean;
}

export default function SubtitleOverlay({
  aiText,
  userInterimText,
  isAISpeaking,
  isUserListening,
}: SubtitleOverlayProps) {
  const [displayText, setDisplayText] = useState('');
  const [displayType, setDisplayType] = useState<'ai' | 'user'>('ai');

  useEffect(() => {
    if (isAISpeaking && aiText) {
      setDisplayText(aiText);
      setDisplayType('ai');
    } else if (isUserListening && userInterimText) {
      setDisplayText(userInterimText);
      setDisplayType('user');
    } else {
      setDisplayText('');
    }
  }, [aiText, userInterimText, isAISpeaking, isUserListening]);

  if (!displayText) return null;

  return (
    <div
      className={`${styles.subtitleOverlay} ${
        displayType === 'ai' ? styles.aiText : styles.userText
      }`}
    >
      <p>{displayText}</p>
    </div>
  );
}
```

**Styles (SubtitleOverlay.module.css):**
```css
.subtitleOverlay {
  position: absolute;
  bottom: 120px;
  left: 50%;
  transform: translateX(-50%);
  max-width: 80%;
  padding: 1rem 1.5rem;
  background: rgba(0, 0, 0, 0.8);
  border-radius: 12px;
  color: white;
  font-size: 16px;
  line-height: 1.5;
  text-align: center;
  z-index: 15;
  animation: fadeIn 0.3s ease;
}

.subtitleOverlay.aiText {
  border-left: 4px solid #1d9e75;
}

.subtitleOverlay.userText {
  border-left: 4px solid #3498db;
}

.subtitleOverlay p {
  margin: 0;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}
```

### 6.5 CompanionView (Orchestration)
```typescript
// components/companion/CompanionView.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '@/hooks/useChat';
import { useEmotionDetection } from '@/hooks/useEmotionDetection';
import AvatarScene from '@/components/avatar/AvatarScene';
import MicButton from './MicButton';
import SubtitleOverlay from './SubtitleOverlay';
import StatusBar from './StatusBar';
import BottomDrawer from './BottomDrawer';
import styles from './CompanionView.module.css';

export default function CompanionView() {
  const { messages, sendMessage, isLoading } = useChat();
  const { detectEmotion } = useEmotionDetection();
  
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState('NEUTRAL');
  const [userInterimText, setUserInterimText] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('/avatars/default.glb');
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);

  const handleUserTranscript = async (transcript: string) => {
    setUserInterimText(transcript);
    setIsListening(false);

    // Detect emotion from user input
    const emotion = await detectEmotion(transcript);
    
    // Send to AI
    const response = await sendMessage(transcript);
    
    // Detect emotion from AI response
    const aiEmotion = await detectEmotion(response);
    setCurrentEmotion(aiEmotion);

    // Speak response
    await speakText(response);
  };

  const speakText = (text: string) => {
    return new Promise<void>((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.95;
      utterance.volume = 1.0;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        resolve();
      };

      speechSynthesisRef.current = utterance;
      speechSynthesis.speak(utterance);
    });
  };

  return (
    <div className={styles.companionView}>
      {/* Avatar Scene */}
      <div className={styles.avatarContainer}>
        <AvatarScene
          avatarUrl={avatarUrl}
          emotion={currentEmotion}
          isListening={isListening}
          isSpeaking={isSpeaking}
        />
      </div>

      {/* Status Bar */}
      <StatusBar />

      {/* Subtitle Overlay */}
      <SubtitleOverlay
        aiText={messages[messages.length - 1]?.content || ''}
        userInterimText={userInterimText}
        isAISpeaking={isSpeaking}
        isUserListening={isListening}
      />

      {/* Mic Button */}
      <MicButton
        onTranscript={handleUserTranscript}
        disabled={isLoading || isSpeaking}
      />

      {/* Bottom Drawer Toggle */}
      <button
        className={styles.drawerToggle}
        onClick={() => setDrawerOpen(!drawerOpen)}
      >
        ⌃
      </button>

      {/* Bottom Drawer */}
      {drawerOpen && (
        <BottomDrawer
          onClose={() => setDrawerOpen(false)}
          messages={messages}
        />
      )}
    </div>
  );
}
```

**Styles (CompanionView.module.css):**
```css
.companionView {
  position: relative;
  width: 100%;
  height: 100vh;
  background: linear-gradient(135deg, #0f1419 0%, #1a2332 100%);
  overflow: hidden;
}

.avatarContainer {
  width: 100%;
  height: 70%;
}

.drawerToggle {
  position: absolute;
  bottom: 100px;
  right: 1rem;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  cursor: pointer;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  z-index: 15;
}

.drawerToggle:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.3);
}
```

---

## 7. Lip Sync Implementation Detail

### Viseme Timing from Web Speech API

The Web Speech API doesn't natively provide phoneme timing, so we use **audio playback position** + **approximation**.

```typescript
// lib/speech.ts
export class LipSyncManager {
  private audioContext: AudioContext;
  private analyser: AnalyserNode;
  private morphTargets: Record<string, THREE.Mesh> = {};

  constructor(audioElement: HTMLAudioElement) {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const source = this.audioContext.createMediaElementAudioSource(audioElement);
    this.analyser = this.audioContext.createAnalyser();
    source.connect(this.analyser);
    this.analyser.connect(this.audioContext.destination);
  }

  /**
   * Simple frequency-based lip sync (alternative to phoneme detection)
   * Maps frequency bands to rough viseme categories
   */
  updateLipSync() {
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);

    const lowFreq = dataArray.slice(0, 10).reduce((a, b) => a + b) / 10; // Bass
    const midFreq = dataArray.slice(40, 80).reduce((a, b) => a + b) / 40; // Mid
    const highFreq = dataArray.slice(100, 255).reduce((a, b) => a + b) / 155; // High

    // Map frequencies to visemes
    const visemeWeights = {
      viseme_AA: lowFreq / 255,    // /a/ sounds in low freq
      viseme_E: highFreq / 255,    // /e/ sounds in high freq
      viseme_I: highFreq / 255,    // /i/ sounds in high freq
      viseme_O: midFreq / 255,     // /o/ sounds in mid freq
      viseme_U: lowFreq / 255,     // /u/ sounds in low freq
      viseme_PP: 0,                // Plosives (handled separately)
    };

    // Apply to morph targets
    Object.entries(visemeWeights).forEach(([viseme, weight]) => {
      if (this.morphTargets[viseme]) {
        this.morphTargets[viseme].morphTargetInfluences?.[0] = weight;
      }
    });
  }

  registerMorphTarget(visemeName: string, mesh: THREE.Mesh) {
    this.morphTargets[visemeName] = mesh;
  }
}
```

---

## 8. Ready Player Me Integration

### Avatar Customization Flow

**User Creates Avatar:**
1. User clicks "Customize Your Companion"
2. Opens Ready Player Me iframe or web interface
3. User designs their AI companion's appearance
4. Ready Player Me returns GLB URL
5. Save URL to user profile in Supabase

```typescript
// lib/readyplayerme.ts
export const generateReadyPlayerMeUrl = (userId: string) => {
  const baseUrl = 'https://readyplayer.me';
  return `${baseUrl}/${userId}?avatarStyle=fullbody`;
};

export const fetchAvatarGLB = async (avatarId: string) => {
  const response = await fetch(`https://api.readyplayer.me/${avatarId}.glb`);
  return response.blob();
};

// components/avatar/AvatarCustomizer.tsx
'use client';

export default function AvatarCustomizer({ userId }: { userId: string }) {
  const [avatarUrl, setAvatarUrl] = useState('');

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.source === 'readyplayer.me' && event.data?.eventType === 'subscribe') {
        const { avatarUrl } = event.data.data;
        setAvatarUrl(avatarUrl);
        // Save to database
        fetch('/api/avatar/customize', {
          method: 'POST',
          body: JSON.stringify({ avatarUrl }),
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <iframe
      src={generateReadyPlayerMeUrl(userId)}
      style={{ width: '100%', height: '600px', border: 'none' }}
    />
  );
}
```

---

## 9. Implementation Priority & Roadmap

### Phase 1: MVP (Week 1-2)
- [ ] Three.js + React Three Fiber setup
- [ ] Load basic GLB avatar model
- [ ] Idle animations (breathing, blinks)
- [ ] Web Speech API STT/TTS integration
- [ ] Basic emotion detection → expression mapping
- [ ] Mic button + full-screen UI layout

### Phase 2: Voice & Sync (Week 3)
- [ ] Lip sync with audio playback
- [ ] Emotion-reactive expressions
- [ ] Subtitle overlay
- [ ] Status bar (streak, score)
- [ ] Listening/speaking animations

### Phase 3: i18n (Week 4)
- [ ] next-intl setup
- [ ] English + French locale files
- [ ] Language switching in settings
- [ ] Voice recognition language binding

### Phase 4: Payments (Week 5)
- [ ] Stripe Checkout integration
- [ ] Trial logic (7 days free)
- [ ] Subscription models
- [ ] Webhook handler
- [ ] Paywall modal (free tier limits)

### Phase 5: Polish & Advanced Features (Week 6+)
- [ ] Avatar customization (Ready Player Me)
- [ ] Bottom drawer (chat history, coaching)
- [ ] Advanced idle animations
- [ ] Performance optimization
- [ ] Mobile gesture support (swipe, tap)

---

## 10. Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Three.js + React Three Fiber | Mature, well-documented 3D for web; great React integration |
| Ready Player Me | Free, user-friendly avatar creation; reduces dev complexity |
| Web Speech API | Built-in, no API key required; good for MVP |
| Viseme-based lip sync | Better than phoneme detection without server calls |
| Stripe for payments | Industry standard; trusted by users |
| next-intl | Simplifies i18n; Next.js App Router native |
| Gsap for animations | Smooth tweens; integrates well with Three.js |
| Dark gradient background | Calming, premium feel; highlights avatar |

---

## 11. Performance Considerations

- **Three.js:** Use LOD (Level of Detail) for avatar if needed; optimize morph targets
- **Speech API:** Set `continuous: false` to prevent memory leaks
- **Animations:** Use `useFrame` sparingly; batch updates
- **Mobile:** Test on iOS/Android; consider WebGL 2.0 limits
- **Audio:** Stream TTS when possible; pre-cache common responses

---

## 12. Accessibility

- **Alt Text:** Describe avatar expressions in aria-labels
- **Voice Feedback:** Ensure text-to-speech has adjustable rate/pitch
- **Keyboard Fallback:** Allow text input if speech unavailable
- **Color Contrast:** Ensure subtitles meet WCAG AA standards
- **Captions:** Provide captions for AI speech in settings

---

## 13. Testing Checklist

- [ ] Avatar loads correctly on desktop & mobile
- [ ] Mic button STT works across browsers
- [ ] TTS plays and lip sync syncs
- [ ] Emotion expressions transition smoothly
- [ ] Idle animations loop without stutter
- [ ] i18n switches language correctly
- [ ] Trial logic displays countdown
- [ ] Stripe webhook receives events correctly
- [ ] Paywall blocks free tier users at limit
- [ ] Bottom drawer swipe gesture works
- [ ] Avatar customization saves & loads

---

## 14. Future Enhancements

- **Advanced Gestures:** Hand wave, arms movement based on conversation
- **Multi-Language Voices:** Celebrity voice packs (premium tier)
- **Companion Personality Profiles:** Different avatar personalities
- **Family Sharing:** Care+ tier allows secondary profiles
- **Offline Mode:** Cache frequently accessed content
- **Video Recording:** Users can record their companion interactions
- **Web Version:** Desktop companion app
- **Apple Watch:** Quick checkins on wearable
- **Integration:** Calendar, reminders, smart home control

---

## 15. File References & Checklist

### New Files to Create (In Order)

**Core Avatar:**
- `components/avatar/AvatarScene.tsx`
- `components/avatar/AvatarModel.tsx`
- `components/avatar/AvatarExpressions.tsx`
- `components/avatar/LipSync.tsx`
- `components/avatar/IdleAnimations.tsx`

**Companion UI:**
- `components/companion/CompanionView.tsx`
- `components/companion/MicButton.tsx`
- `components/companion/MicButton.module.css`
- `components/companion/SubtitleOverlay.tsx`
- `components/companion/SubtitleOverlay.module.css`
- `components/companion/StatusBar.tsx`
- `components/companion/BottomDrawer.tsx`

**Payments:**
- `app/api/stripe/checkout/route.ts`
- `app/api/stripe/webhook/route.ts`
- `app/api/stripe/portal/route.ts`
- `app/api/subscription/check/route.ts`
- `components/payments/PricingCards.tsx`
- `components/payments/PaywallModal.tsx`
- `components/payments/TrialBanner.tsx`

**i18n:**
- `lib/i18n.ts`
- `locales/en.json`
- `locales/fr.json`

**Lib/Utilities:**
- `lib/stripe.ts`
- `lib/speech.ts`
- `lib/animations.ts`
- `lib/emotion.ts`
- `lib/readyplayerme.ts`

**Pages:**
- `app/[locale]/(app)/companion/page.tsx`
- `app/[locale]/(app)/settings/page.tsx`
- `app/[locale]/(app)/subscribe/page.tsx`

**Database:**
- Update `prisma/schema.prisma` with `Subscription` model

---

## 16. Dependencies to Install

```bash
npm install three @react-three/fiber @react-three/drei
npm install next-intl
npm install stripe @stripe/react-stripe-js
npm install gsap
npm install zustand  # (if using Zustand for state)
npm install react-spring  # (alternative animation library)
```

---

**Document Version:** 1.0  
**Last Updated:** 2026-04-08  
**Status:** Ready for Cursor Implementation  
**Next Step:** Hand to Cursor with Phase 1 focus
