import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Play, Square, RotateCcw, ArrowRight, Image as ImageIcon, Timer, DollarSign, UserPlus, User, Search } from 'lucide-react';

interface Message {
  id: string;
  username: string;
  message: string;
  color?: string;
}

interface Props {
  messages: Message[];
  onLeave: () => void;
}

interface Item {
  name: string;
  price: number;
  imageUrl: string;
}

const RANDOM_ITEMS: Item[] = [
  { name: 'PlayStation 5', price: 499, imageUrl: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800&q=80' },
  { name: 'iPhone 15 Pro', price: 999, imageUrl: 'https://images.unsplash.com/photo-1696446701796-da61225697cc?w=800&q=80' },
  { name: 'Mechanical Keyboard', price: 150, imageUrl: 'https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?w=800&q=80' },
  { name: 'Gaming Chair', price: 350, imageUrl: 'https://images.unsplash.com/photo-1598550476439-6847785fce66?w=800&q=80' },
  { name: 'AirPods Pro', price: 249, imageUrl: 'https://images.unsplash.com/photo-1588423770674-f2855ee476e7?w=800&q=80' },
  { name: 'Nintendo Switch OLED', price: 349, imageUrl: 'https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=800&q=80' },
  { name: 'Sony WH-1000XM5', price: 399, imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80' },
  { name: 'GoPro Hero 12', price: 399, imageUrl: 'https://images.unsplash.com/photo-1526170315870-ef0cd9c5949a?w=800&q=80' },
  { name: 'Kindle Paperwhite', price: 139, imageUrl: 'https://images.unsplash.com/photo-1594980596247-87c52a646cfb?w=800&q=80' },
  { name: 'Lego Star Wars Millennium Falcon', price: 849, imageUrl: 'https://images.unsplash.com/photo-1585366119957-e9730b6d0f60?w=800&q=80' },
  { name: 'Dyson V15 Vacuum', price: 749, imageUrl: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=800&q=80' },
  { name: 'Samsung Galaxy S23 Ultra', price: 1199, imageUrl: 'https://images.unsplash.com/photo-1678911820864-e2c567c655d7?w=800&q=80' },
  { name: 'NVIDIA RTX 4090', price: 1599, imageUrl: 'https://images.unsplash.com/photo-1667990278450-482860829875?w=800&q=80' },
  { name: 'Apple Watch Ultra 2', price: 799, imageUrl: 'https://images.unsplash.com/photo-1695653422718-990ee00017e0?w=800&q=80' },
  { name: 'Nespresso Coffee Machine', price: 199, imageUrl: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=800&q=80' },
  { name: 'Tesla Model 3', price: 38990, imageUrl: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&q=80' },
  { name: 'Rolex Submariner', price: 9100, imageUrl: 'https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=800&q=80' },
  { name: 'Herman Miller Aeron', price: 1600, imageUrl: 'https://images.unsplash.com/photo-1589384273441-c5ae2f670ee5?w=800&q=80' },
  { name: 'DJI Mavic 3 Pro', price: 2199, imageUrl: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=800&q=80' },
  { name: 'Canon EOS R5', price: 3399, imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80' },
  { name: 'MacBook Pro 16"', price: 2499, imageUrl: 'https://images.unsplash.com/photo-1517336714468-48356af71f1f?w=800&q=80' },
  { name: 'iPad Pro 12.9"', price: 1099, imageUrl: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&q=80' },
  { name: 'Steam Deck OLED', price: 549, imageUrl: 'https://images.unsplash.com/photo-1683525540602-53641753697e?w=800&q=80' },
  { name: 'Meta Quest 3', price: 499, imageUrl: 'https://images.unsplash.com/photo-1622979135225-d2ba269cf1ac?w=800&q=80' },
  { name: 'Dyson Airwrap', price: 599, imageUrl: 'https://images.unsplash.com/photo-1610991148731-30716af1b34b?w=800&q=80' },
  { name: 'Segway Ninebot Max', price: 799, imageUrl: 'https://images.unsplash.com/photo-1605152276897-4f618f831968?w=800&q=80' },
  { name: 'Peloton Bike+', price: 2495, imageUrl: 'https://images.unsplash.com/photo-1591741535018-d042766c62eb?w=800&q=80' },
  { name: 'Weber Genesis Grill', price: 1249, imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800&q=80' },
  { name: 'KitchenAid Stand Mixer', price: 449, imageUrl: 'https://images.unsplash.com/photo-1594385208934-27a59f518475?w=800&q=80' },
  { name: 'Yeti Tundra 45 Cooler', price: 325, imageUrl: 'https://images.unsplash.com/photo-1625693941344-6873c9767058?w=800&q=80' },
  { name: 'Samsung 98" Neo QLED 8K TV', price: 9999, imageUrl: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800&q=80' },
  { name: 'Bose QuietComfort Ultra', price: 429, imageUrl: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&q=80' },
  { name: 'Razer Blade 16', price: 2999, imageUrl: 'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=800&q=80' },
  { name: 'Logitech G Pro X Superlight 2', price: 159, imageUrl: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800&q=80' },
  { name: 'Elgato Stream Deck MK.2', price: 149, imageUrl: 'https://images.unsplash.com/photo-1616433357599-270889988292?w=800&q=80' },
  { name: 'Blue Yeti Microphone', price: 129, imageUrl: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=800&q=80' },
  { name: 'Nanoleaf Shapes', price: 199, imageUrl: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?w=800&q=80' },
  { name: 'Philips Hue Starter Kit', price: 179, imageUrl: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=800&q=80' },
  { name: 'Ring Video Doorbell Pro 2', price: 249, imageUrl: 'https://images.unsplash.com/photo-1621146028531-5683251f5e23?w=800&q=80' },
  { name: 'iRobot Roomba j7+', price: 799, imageUrl: 'https://images.unsplash.com/photo-1518640467707-6811f4a6ab73?w=800&q=80' },
  { name: 'Breville Barista Express', price: 699, imageUrl: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=800&q=80' },
  { name: 'Vitamix A3500', price: 649, imageUrl: 'https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=800&q=80' },
  { name: 'Instant Pot Duo 7-in-1', price: 99, imageUrl: 'https://images.unsplash.com/photo-1585238342024-78d387f4a707?w=800&q=80' },
  { name: 'Le Creuset Dutch Oven', price: 390, imageUrl: 'https://images.unsplash.com/photo-1584346133934-a3afd2a33c4c?w=800&q=80' },
  { name: 'Ember Mug 2', price: 129, imageUrl: 'https://images.unsplash.com/photo-1517142089942-ba376ce32a2e?w=800&q=80' },
  { name: 'Theragun PRO', price: 599, imageUrl: 'https://images.unsplash.com/photo-1620288627223-53302f4e8c74?w=800&q=80' },
  { name: 'Oura Ring Gen3', price: 299, imageUrl: 'https://images.unsplash.com/photo-1613913399314-87b127b49d13?w=800&q=80' },
  { name: 'Bowflex SelectTech 552', price: 429, imageUrl: 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=800&q=80' },
  { name: 'Hydro Flask 32 oz', price: 44, imageUrl: 'https://images.unsplash.com/photo-1602143303410-7199d123ad24?w=800&q=80' },
  { name: 'Patagonia Better Sweater', price: 139, imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&q=80' },
  { name: 'Canada Goose Expedition Parka', price: 1495, imageUrl: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=800&q=80' },
  { name: 'Louis Vuitton Neverfull MM', price: 2030, imageUrl: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&q=80' },
  { name: 'Gucci Double G Belt', price: 490, imageUrl: 'https://images.unsplash.com/photo-1624222247344-550fb8ec5521?w=800&q=80' },
  { name: 'Ray-Ban Wayfarer', price: 163, imageUrl: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&q=80' },
  { name: 'Rimowa Original Cabin', price: 1430, imageUrl: 'https://images.unsplash.com/photo-1565026057447-bc90a3dceb87?w=800&q=80' },
  { name: 'Tumi Alpha 3 Carry-On', price: 825, imageUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&q=80' },
  { name: 'Fender Stratocaster', price: 849, imageUrl: 'https://images.unsplash.com/photo-1550291652-6ea9114a47b1?w=800&q=80' },
  { name: 'Gibson Les Paul Standard', price: 2799, imageUrl: 'https://images.unsplash.com/photo-1564186763535-ebb21ef52784?w=800&q=80' },
  { name: 'Yamaha P-125 Digital Piano', price: 699, imageUrl: 'https://images.unsplash.com/photo-1520529611443-d22364e89ca5?w=800&q=80' },
  { name: 'Eames Lounge Chair', price: 7995, imageUrl: 'https://images.unsplash.com/photo-1581539250439-c96689b516dd?w=800&q=80' },
  { name: 'Marshall Stanmore III', price: 379, imageUrl: 'https://images.unsplash.com/photo-1589003077984-894e133dabab?w=800&q=80' },
  { name: 'Audio-Technica LP120X', price: 349, imageUrl: 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=800&q=80' },
  { name: 'Specialized Tarmac SL8', price: 14000, imageUrl: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=800&q=80' },
  { name: 'Brompton C Line', price: 1750, imageUrl: 'https://images.unsplash.com/photo-1571068316344-75bc76f77891?w=800&q=80' },
  { name: 'Big Green Egg (Large)', price: 1200, imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80' },
  { name: 'Solo Stove Bonfire 2.0', price: 299, imageUrl: 'https://images.unsplash.com/photo-1521220609214-a8552380c7a4?w=800&q=80' },
  { name: 'Garmin fenix 7X', price: 899, imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80' },
  { name: 'Arc\'teryx Alpha SV', price: 900, imageUrl: 'https://images.unsplash.com/photo-1544006659-f0b21f04cb1d?w=800&q=80' },
  { name: 'Osprey Aether 65', price: 320, imageUrl: 'https://images.unsplash.com/photo-1551632432-c735e7a030be?w=800&q=80' },
  { name: 'Ferrari SF90 Stradale', price: 524000, imageUrl: 'https://images.unsplash.com/photo-1592198084033-aade902d1aae?w=800&q=80' },
  { name: 'Lamborghini Aventador', price: 500000, imageUrl: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&q=80' },
  { name: 'Hermès Birkin 30', price: 12000, imageUrl: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&q=80' },
  { name: 'Patek Philippe Nautilus', price: 35000, imageUrl: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=800&q=80' },
  { name: 'Leica M11 Camera', price: 8995, imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80' },
  { name: 'Bang & Olufsen Beolab 90', price: 115000, imageUrl: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&q=80' },
  { name: 'Audeze LCD-5 Headphones', price: 4500, imageUrl: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&q=80' },
  { name: 'Sennheiser HE 1', price: 59000, imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80' },
  { name: 'Steinway Model D Piano', price: 190000, imageUrl: 'https://images.unsplash.com/photo-1520529611443-d22364e89ca5?w=800&q=80' },
  { name: 'Kartell Componibili', price: 150, imageUrl: 'https://images.unsplash.com/photo-1581539250439-c96689b516dd?w=800&q=80' },
  { name: 'Vitra Panton Chair', price: 450, imageUrl: 'https://images.unsplash.com/photo-1581539250439-c96689b516dd?w=800&q=80' },
  { name: 'LEGO Disney Castle', price: 399, imageUrl: 'https://images.unsplash.com/photo-1585366119957-e9730b6d0f60?w=800&q=80' },
  { name: 'Tamagotchi Pix', price: 59, imageUrl: 'https://images.unsplash.com/photo-1585366119957-e9730b6d0f60?w=800&q=80' },
  { name: 'Barbie Dreamhouse', price: 199, imageUrl: 'https://images.unsplash.com/photo-1585366119957-e9730b6d0f60?w=800&q=80' },
  { name: 'DJI Osmo Pocket 3', price: 519, imageUrl: 'https://images.unsplash.com/photo-1526170315870-ef0cd9c5949a?w=800&q=80' },
  { name: 'Insta360 X3', price: 449, imageUrl: 'https://images.unsplash.com/photo-1526170315870-ef0cd9c5949a?w=800&q=80' },
  { name: 'Fujifilm Instax Mini 12', price: 79, imageUrl: 'https://images.unsplash.com/photo-1526170315870-ef0cd9c5949a?w=800&q=80' },
  { name: 'Polaroid Now+', price: 149, imageUrl: 'https://images.unsplash.com/photo-1526170315870-ef0cd9c5949a?w=800&q=80' },
  { name: 'Akai MPC One+', price: 699, imageUrl: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=800&q=80' },
  { name: 'Onewheel GT', price: 2250, imageUrl: 'https://images.unsplash.com/photo-1605152276897-4f618f831968?w=800&q=80' },
];

export const PriceIsRightGame: React.FC<Props> = ({ messages, onLeave }) => {
  const [status, setStatus] = useState<'setup' | 'guessing' | 'revealed' | 'game_over'>('setup');
  const [item, setItem] = useState<Item>({ name: '', price: 0, imageUrl: '' });
  const [guesses, setGuesses] = useState<Record<string, number>>({});
  const [joinedPlayers, setJoinedPlayers] = useState<Set<string>>(new Set());
  const [timeLeft, setTimeLeft] = useState(60);
  const [streamerGuess, setStreamerGuess] = useState<string>('');
  const [winner, setWinner] = useState<{ username: string; guess: number; diff: number } | null>(null);
  const [totalRounds, setTotalRounds] = useState(3);
  const [currentRound, setCurrentRound] = useState(0);
  const [scores, setScores] = useState<Record<string, number>>({});
  
  const processedMessageIds = useRef<Set<string>>(new Set());
  const timerRef = useRef<number | null>(null);
  const usedItemIndicesRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (messages.length === 0) return;

    const latestMessage = messages[messages.length - 1];
    if (processedMessageIds.current.has(latestMessage.id)) return;
    processedMessageIds.current.add(latestMessage.id);

    const text = latestMessage.message.trim().toLowerCase();
    
    // Handle !join - works in both setup and guessing states
    if (text === '!join') {
      setJoinedPlayers(prev => {
        const next = new Set(prev);
        next.add(latestMessage.username);
        return next;
      });
      return;
    }

    if (status !== 'guessing') return;

    // Only accept guesses from joined players
    if (!joinedPlayers.has(latestMessage.username)) return;

    // Extract number from message
    const match = text.match(/\d+/);
    if (match) {
      const guess = parseInt(match[0], 10);
      if (!isNaN(guess) && guess > 0) {
        setGuesses(prev => ({
          ...prev,
          [latestMessage.username]: guess
        }));
      }
    }
  }, [messages, status, joinedPlayers]);

  useEffect(() => {
    if (status === 'guessing') {
      timerRef.current = window.setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            revealPrice();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status]);

  const startGame = () => {
    setCurrentRound(1);
    setScores({});
    usedItemIndicesRef.current.clear();
    startRound(1);
  };

  const startRound = (roundNum: number) => {
    const availableIndices = RANDOM_ITEMS.map((_, i) => i).filter(i => !usedItemIndicesRef.current.has(i));
    let indexToUse;
    
    if (availableIndices.length === 0) {
      usedItemIndicesRef.current.clear();
      indexToUse = Math.floor(Math.random() * RANDOM_ITEMS.length);
    } else {
      indexToUse = availableIndices[Math.floor(Math.random() * availableIndices.length)];
    }
    
    usedItemIndicesRef.current.add(indexToUse);
    const randomItem = RANDOM_ITEMS[indexToUse];
    setItem(randomItem);
    setGuesses({});
    setWinner(null);
    setTimeLeft(60);
    setStreamerGuess('');
    setStatus('guessing');
    processedMessageIds.current.clear();
  };

  const nextRound = () => {
    if (currentRound < totalRounds) {
      const nextR = currentRound + 1;
      setCurrentRound(nextR);
      startRound(nextR);
    } else {
      setStatus('game_over');
    }
  };

  const revealPrice = () => {
    setStatus('revealed');
    
    const allGuesses = { ...guesses };
    // Streamer guess is not added to allGuesses for winner calculation as per request
    
    // Find closest within 5% margin
    const threshold = item.price * 0.05;
    let bestGuess: { username: string; guess: number; diff: number } | null = null;
    
    Object.entries(allGuesses).forEach(([username, guess]) => {
      const diff = Math.abs(item.price - guess);
      if (diff <= threshold) {
        if (!bestGuess || diff < bestGuess.diff) {
          bestGuess = { username, guess, diff };
        }
      }
    });

    if (bestGuess) {
      setWinner(bestGuess);
      setScores(prev => ({
        ...prev,
        [bestGuess!.username]: (prev[bestGuess!.username] || 0) + 1
      }));
    } else {
      setWinner(null);
    }
  };

  const sortedGuesses = [
    ...(streamerGuess && !isNaN(parseInt(streamerGuess)) ? [['أنت (الستريمر)', parseInt(streamerGuess)] as [string, number]] : []),
    ...Object.entries(guesses)
  ].sort(([, a], [, b]) => b - a)
   .slice(0, 15);

  const finalScores = Object.entries(scores)
    .sort(([, a], [, b]) => b - a);

  return (
    <div className="flex flex-col h-full max-w-6xl mx-auto bg-black/40 backdrop-blur-md rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/5">
        <div className="flex items-center gap-4">
          <button
            onClick={onLeave}
            className="p-3 hover:bg-white/10 rounded-xl transition-colors"
          >
            <ArrowRight className="w-6 h-6" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-white">خمن السعر</h2>
            <p className="text-zinc-400 text-sm">أقرب تخمين للسعر الحقيقي بدون تجاوزه يفوز!</p>
          </div>
        </div>
        
        {(status === 'guessing' || status === 'revealed') && (
          <div className="flex items-center gap-6">
            <div className="text-zinc-400 font-bold">
              الجولة <span className="text-white text-xl">{currentRound}</span> من <span className="text-white text-xl">{totalRounds}</span>
            </div>
            {status === 'guessing' && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-blue-500/20 text-blue-400 px-6 py-3 rounded-xl font-bold text-xl border border-blue-500/30">
                  <Timer className="w-6 h-6" />
                  {timeLeft} ثانية
                </div>
                <button
                  onClick={revealPrice}
                  className="flex items-center gap-2 px-6 py-3 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-xl font-bold transition-colors"
                >
                  <Square className="w-5 h-5 fill-current" />
                  إنهاء التخمين
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Game Area */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 relative overflow-y-auto">
          {status === 'setup' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-md bg-white/5 p-12 rounded-3xl border border-white/10 text-center relative overflow-hidden"
            >
              {/* Game Show Background Decoration */}
              <div className="absolute inset-0 opacity-10 z-0 pointer-events-none">
                <img 
                  src="/priceisright.png" 
                  alt="Game Show Background" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=800&q=80";
                  }}
                />
              </div>

              <div className="relative z-10">
                <DollarSign className="w-32 h-32 text-green-500 mx-auto mb-8 drop-shadow-[0_0_20px_rgba(34,197,94,0.3)]" />
                <h3 className="text-3xl font-bold text-white mb-4">لعبة خمن السعر</h3>
                <p className="text-zinc-400 mb-8 text-lg">سيتم اختيار منتج عشوائي عند البدء. اطلب من المتابعين كتابة <span className="text-blue-400 font-bold">!join</span> للمشاركة.</p>
                
                <div className="mb-10 text-right">
                  <label className="block text-zinc-400 mb-3 font-bold">عدد الجولات</label>
                  <div className="flex gap-3">
                    {[3, 5, 10, 15].map(num => (
                      <button
                        key={num}
                        onClick={() => setTotalRounds(num)}
                        className={`flex-1 py-3 rounded-xl font-bold border transition-all ${
                          totalRounds === num 
                          ? 'bg-blue-600 border-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]' 
                          : 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={startGame}
                  className="w-full flex items-center justify-center gap-3 py-6 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold text-2xl transition-all shadow-[0_0_30px_rgba(37,99,235,0.4)] hover:shadow-[0_0_40px_rgba(37,99,235,0.6)] active:scale-95"
                >
                  <Play className="w-8 h-8 fill-current" />
                  ابدأ اللعبة
                </button>
              </div>
            </motion.div>
          )}

          {(status === 'guessing' || status === 'revealed') && (
            <div className="flex flex-col items-center w-full max-w-2xl">
              <div className="w-full bg-white/5 border border-white/10 rounded-3xl p-8 mb-8 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 to-transparent z-0" />
                <div className="relative z-10">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="w-64 h-64 object-contain mx-auto mb-6 rounded-2xl bg-white/5 p-4 shadow-2xl" />
                  ) : (
                    <div className="w-64 h-64 mx-auto mb-6 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                      <ImageIcon className="w-24 h-24 text-zinc-600" />
                    </div>
                  )}
                  <h3 className="text-4xl font-bold text-white mb-2">{item.name}</h3>
                  <p className="text-xl text-zinc-400 mb-4">اكتب <span className="text-blue-400 font-bold">!join</span> للمشاركة، ثم خمن السعر!</p>
                  
                  {status === 'guessing' && (
                    <div className="mt-8 bg-white/5 p-6 rounded-2xl border border-white/10 max-w-sm mx-auto">
                      <label className="block text-zinc-400 mb-2 text-sm font-bold uppercase tracking-wider">تخمينك (الستريمر)</label>
                      <div className="flex gap-2">
                        <input
                          type="password"
                          value={streamerGuess}
                          onChange={(e) => setStreamerGuess(e.target.value)}
                          className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors text-center font-bold text-xl"
                          placeholder="أدخل تخمينك..."
                        />
                      </div>
                      <p className="text-zinc-500 text-xs mt-2 italic">التخمين مخفي لمنع الغش</p>
                    </div>
                  )}

                  {status === 'revealed' && (
                    <motion.div 
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="inline-block bg-green-500/20 border border-green-500/50 rounded-2xl px-12 py-6 mt-4"
                    >
                      <div className="text-green-400 text-sm font-bold mb-2 uppercase tracking-wider">السعر الحقيقي</div>
                      <div className="text-6xl font-bold text-white glow-green-text flex items-center justify-center gap-2">
                        <DollarSign className="w-12 h-12 text-green-400" />
                        {item.price}
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>

              {status === 'revealed' && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="w-full text-center"
                >
                  {winner ? (
                    <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-3xl p-8 relative overflow-hidden">
                      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 mix-blend-overlay" />
                      <Trophy className="w-20 h-20 text-yellow-500 mx-auto mb-4 drop-shadow-[0_0_20px_rgba(234,179,8,0.5)]" />
                      <h4 className="text-2xl text-yellow-500/80 font-bold mb-2">فائز الجولة</h4>
                      <div className="text-5xl font-bold text-white mb-4">{winner.username}</div>
                      <div className="text-xl text-zinc-300">
                        خمن: <span className="text-green-400 font-bold mx-2">${winner.guess}</span>
                        (الفرق: ${winner.diff})
                      </div>
                    </div>
                  ) : (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-3xl p-8">
                      <h4 className="text-3xl font-bold text-red-400 mb-2">لا يوجد فائز!</h4>
                      <p className="text-xl text-zinc-400">جميع التخمينات تجاوزت السعر الحقيقي.</p>
                    </div>
                  )}

                  <button
                    onClick={nextRound}
                    className="mt-8 flex items-center gap-2 px-12 py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold text-xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] mx-auto"
                  >
                    {currentRound < totalRounds ? 'الجولة التالية' : 'النتائج النهائية'}
                    <ArrowRight className="w-6 h-6 rotate-180" />
                  </button>
                </motion.div>
              )}
            </div>
          )}

          {status === 'game_over' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center w-full max-w-2xl"
            >
              <Trophy className="w-32 h-32 text-yellow-500 mx-auto mb-6 drop-shadow-[0_0_30px_rgba(234,179,8,0.5)]" />
              <h3 className="text-4xl font-bold text-white mb-8">انتهت اللعبة!</h3>
              
              <div className="bg-white/5 border border-white/10 rounded-3xl p-8 mb-8">
                <h4 className="text-2xl font-bold text-zinc-400 mb-6 uppercase tracking-wider">الترتيب النهائي</h4>
                <div className="space-y-4">
                  {finalScores.map(([username, score], index) => (
                    <div key={username} className="flex items-center justify-between bg-white/5 p-4 rounded-xl border border-white/10">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                          index === 0 ? 'bg-yellow-500 text-black' :
                          index === 1 ? 'bg-zinc-300 text-black' :
                          index === 2 ? 'bg-amber-600 text-black' :
                          'bg-white/10 text-white'
                        }`}>
                          {index + 1}
                        </div>
                        <span className="text-xl font-bold text-white">{username}</span>
                      </div>
                      <div className="text-2xl font-bold text-blue-400">{score} فوز</div>
                    </div>
                  ))}
                  {finalScores.length === 0 && (
                    <div className="text-zinc-500 py-4">لا يوجد فائزون في هذه اللعبة</div>
                  )}
                </div>
              </div>

              <button
                onClick={() => setStatus('setup')}
                className="flex items-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-lg transition-colors mx-auto"
              >
                <RotateCcw className="w-6 h-6" />
                لعبة جديدة
              </button>
            </motion.div>
          )}
        </div>

        {/* Live Guesses Sidebar */}
        <div className="w-80 bg-black/40 border-r border-white/10 p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <UserPlus className="w-6 h-6 text-blue-400" />
              <h3 className="text-xl font-bold text-white">المشاركون ({joinedPlayers.size})</h3>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
            <AnimatePresence>
              {/* Streamer Guess in Sidebar */}
              {status === 'guessing' && streamerGuess && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-blue-500/20 border border-blue-500/50 rounded-xl p-4 flex items-center justify-between"
                >
                  <div className="flex flex-col">
                    <span className="font-bold text-white">أنت (الستريمر)</span>
                    <span className="text-xs text-blue-400 font-bold italic">تم التخمين (سري)</span>
                  </div>
                  <div className="w-10 h-6 bg-blue-500/30 rounded-md animate-pulse" />
                </motion.div>
              )}

              {/* Viewer & Streamer Guesses */}
              {sortedGuesses.map(([username, guess]) => {
                const isStreamer = username === 'أنت (الستريمر)';
                const isWinner = status === 'revealed' && winner?.username === username;
                const threshold = item.price * 0.05;
                const isOutOfRange = status === 'revealed' && Math.abs(item.price - guess) > threshold;
                const isGuessing = status === 'guessing';
                
                return (
                  <motion.div
                    key={username}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`border rounded-xl p-4 flex items-center justify-between transition-colors ${
                      isWinner ? 'bg-yellow-500/20 border-yellow-500/50' :
                      isOutOfRange ? 'bg-red-500/10 border-red-500/20 opacity-50' :
                      isStreamer ? 'bg-blue-500/10 border-blue-500/30' :
                      'bg-white/5 border-white/10'
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="font-bold text-white truncate max-w-[120px]">{username}</span>
                      {isWinner && <span className="text-xs text-yellow-500 font-bold">الفائز!</span>}
                      {isOutOfRange && <span className="text-xs text-red-400">خارج نطاق الـ 5%</span>}
                      {isStreamer && <span className="text-xs text-blue-400 font-bold">للعرض فقط</span>}
                      {isGuessing && <span className="text-xs text-green-500 font-bold italic">تم التخمين (سري)</span>}
                    </div>
                    {isGuessing ? (
                      <div className="w-10 h-6 bg-green-500/20 rounded-md animate-pulse" />
                    ) : (
                      <span className={`font-bold text-lg ${isWinner ? 'text-yellow-500' : isOutOfRange ? 'text-red-400' : 'text-green-400'}`}>
                        ${guess}
                      </span>
                    )}
                  </motion.div>
                );
              })}
              
              {/* Joined but not guessed */}
              {Array.from(joinedPlayers).filter(p => !guesses[p]).map(username => (
                <motion.div
                  key={username}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between opacity-60"
                >
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-zinc-500" />
                    <span className="font-bold text-zinc-300 truncate max-w-[120px]">{username}</span>
                  </div>
                  <span className="text-xs text-zinc-500 italic">بانتظار التخمين...</span>
                </motion.div>
              ))}

              {joinedPlayers.size === 0 && !streamerGuess && (
                <div className="text-center text-zinc-500 py-8">
                  لا يوجد مشاركون بعد.<br/>اكتب <span className="text-blue-400 font-bold">!join</span> للمشاركة!
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};
