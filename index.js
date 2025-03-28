const express = require('express');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Supabase Config
const SUPABASE_URL = 'https://wmxmfhfyoifqgkfgpyrd.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndteG1maGZ5b2lmcWdrZmdweXJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMxMDY4MjUsImV4cCI6MjA1ODY4MjgyNX0.zBgIxLs8ABI0Nz2JLdcEASsStkkm6_G4sQT31924tI4';

// Static Jokes (40 total: 5 pro, 5 nobody per category)
const jokes = {
  1: { // Observational
    pro: [
      "Why do smartphones autocorrect ‘lol’ into ‘LOL’ — are they judging how funny we think we are?",
      "We buy bottled water to avoid tap water, then pay extra for flavored water that’s just tap water with regret.",
      "Airplanes announce ‘We’re about to experience some turbulence’ like it’s optional entertainment.",
      "Grocery stores put candy at checkout because they know we’re all broke but still desperate to feel alive.",
      "We pay for gym memberships just to scroll Instagram on the treadmill — fitness by proxy."
    ],
    nobody: [
      "I swear my dog knows I’m broke before I do.",
      "Fast food lines move slower when you’re starving.",
      "My boss calls it ‘team building’—I call it unpaid overtime.",
      "Why do socks vanish in the dryer but never in the wash?",
      "I tip delivery guys like they’re my therapists."
    ]
  },
  2: { // Dark Humor
    pro: [
      "Who cares if a kid dies? How many kids do you know who get to die a winner?",
      "Why is the car‑pool lane enforced so strictly, yet the Ku Klux Klan still has a free pass?",
      "Tell me you’re scared of death without telling me you’re scared of death.",
      "I sometimes wonder how much better life would be if my partner died.",
      "I’m so glad Stephen Hawking’s dead — look at you guys, you’re heartless. How much longer do you want him to suffer?"
    ],
    nobody: [
      "I’d RSVP to my own funeral, but I’d ghost it.",
      "My dating profile says ‘loves long walks’—to the fridge at 3 AM.",
      "I’d sell my kidney, but who’d buy used junk?",
      "Life’s a comedy—too bad I’m the punchline.",
      "I’d cry for help, but my Wi-Fi’s down."
    ]
  },
  3: { // Dad
    pro: [
      "I only know 25 letters of the alphabet — I don’t know y.",
      "What do you call fake spaghetti? An impasta.",
      "Want to hear a joke about construction? I’m still working on it.",
      "I used to hate facial hair… but then it grew on me.",
      "How do you make holy water? You boil the hell out of it."
    ],
    nobody: [
      "I told my wife I’d fix the sink—now we’re both wet.",
      "My lawnmower’s so loud, it’s grass-roots activism.",
      "I’d tell a roof joke, but it’s over your head.",
      "I named my car ‘Nap’—it’s always tired.",
      "I’d grill, but the steaks are too high."
    ]
  },
  4: { // Crypto
    pro: [
      "Crypto: where you invest thousands to lose half your money while learning math you never wanted.",
      "Buying crypto is the only time people willingly gamble on something they can’t touch, taste, or explain.",
      "Crypto influencers are like used‑car salesmen with better lighting and worse predictions.",
      "Blockchain: solving problems we didn’t know we had in ways nobody understands.",
      "Crypto conferences: where you network by explaining Bitcoin to people who already lost money."
    ],
    nobody: [
      "My crypto wallet’s so empty, it’s a ghost chain.",
      "I mined Bitcoin—now I’m broke and sweaty.",
      "I’d HODL, but my hands are shaking.",
      "Crypto’s my retirement plan—if I live to zero.",
      "I bought the dip and now I’m dipping into savings."
    ]
  }
};

// Initial Frame: Choose Style
app.get('/', (req, res) => {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta property="og:image" content="https://i.imgur.com/ylCYYra.png" />
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="https://i.imgur.com/ylCYYra.png" />
        <meta property="fc:frame:button:1" content="Observational" />
        <meta property="fc:frame:button:2" content="Dark Humor" />
        <meta property="fc:frame:button:3" content="Dad" />
        <meta property="fc:frame:button:4" content="Crypto" />
        <meta property="fc:frame:post_url" content="${req.protocol}://${req.get('host')}/joke" />
      </head>
    </html>
  `;
  res.set('Content-Type', 'text/html');
  res.send(html);
});

// Deliver Random Joke
app.post('/joke', (req, res) => {
  const buttonIndex = req.body.untrustedData.buttonIndex;
  const category = jokes[buttonIndex] || { pro: ["Mic drop!"], nobody: ["No laughs here!"] };
  const isPro = Math.random() > 0.5;
  const jokeList = isPro ? category.pro : category.nobody;
  const joke = jokeList[Math.floor(Math.random() * jokeList.length)];
  const source = isPro ? "Pro" : "Nobody";
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta property="og:image" content="https://i.imgur.com/4OUnU2i.png" />
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="https://i.imgur.com/4OUnU2i.png" />
        <meta property="fc:frame:button:1" content="Laugh" />
        <meta property="fc:frame:button:2" content="Boo" />
        <meta property="fc:frame:button:3" content="Leaderboard" />
        <meta property="fc:frame:button:4" content="Submit Joke" />
        <meta property="fc:frame:post_url" content="${req.protocol}://${req.get('host')}/vote?joke=${encodeURIComponent(joke)}" />
      </head>
    </html>
  `;
  res.set('Content-Type', 'text/html');
  res.send(html);
});

// Voting and Actions
app.post('/vote', async (req, res) => {
  const buttonIndex = req.body.untrustedData.buttonIndex;
  const joke = req.query.joke;

  if (buttonIndex === 1 || buttonIndex === 2) { // Laugh or Boo
    const voteType = buttonIndex === 1 ? 'laughs' : 'boos';
    try {
      const { data } = await axios.get(`${SUPABASE_URL}/rest/v1/votes?joke_text=eq.${encodeURIComponent(joke)}`, {
        headers: { 'apikey': SUPABASE_KEY }
      });
      if (data.length) {
        await axios.patch(`${SUPABASE_URL}/rest/v1/votes?joke_text=eq.${encodeURIComponent(joke)}`, 
          { [voteType]: data[0][voteType] + 1 },
          { headers: { 'apikey': SUPABASE_KEY, 'Content-Type': 'application/json' } }
        );
      } else {
        await axios.post(`${SUPABASE_URL}/rest/v1/votes`, 
          { joke_text: joke, [voteType]: 1 },
          { headers: { 'apikey': SUPABASE_KEY, 'Content-Type': 'application/json' } }
        );
      }
    } catch (error) {
      console.error('Vote error:', error);
    }
    const reaction = buttonIndex === 1
      ? "Wild Applause! Tip $DEGEN if you laughed!"
      : "Get off the stage! Try again?";
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta property="og:image" content="https://i.imgur.com/h5H38OM.png" />
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="https://i.imgur.com/h5H38OM.png" />
          <meta property="fc:frame:button:1" content="Another!" />
          <meta property="fc:frame:post_url" content="${req.protocol}://${req.get('host')}/" />
        </head>
      </html>
    `;
    res.set('Content-Type', 'text/html');
    res.send(html);
  } else if (buttonIndex === 3) { // Leaderboard
    const { data } = await axios.get(`${SUPABASE_URL}/rest/v1/votes?order=laughs.desc&limit=3`, {
      headers: { 'apikey': SUPABASE_KEY }
    });
    const leaderboard = data.map((item, i) => `${i + 1}. ${item.joke_text} (Laughs: ${item.laughs}, Boos: ${item.boos})`).join('\n');
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta property="og:image" content="https://i.imgur.com/ylCYYra.png" /> <!-- Using initial image as placeholder -->
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="https://i.imgur.com/ylCYYra.png" />
          <meta property="fc:frame:button:1" content="Back" />
          <meta property="fc:frame:post_url" content="${req.protocol}://${req.get('host')}/" />
        </head>
      </html>
    `;
    res.set('Content-Type', 'text/html');
    res.send(html);
  } else if (buttonIndex === 4) { // Submit Joke
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta property="og:image" content="https://i.imgur.com/ylCYYra.png" /> <!-- Using initial image as placeholder -->
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="https://i.imgur.com/ylCYYra.png" />
          <meta property="fc:frame:input:text" content="Category # + Joke" />
          <meta property="fc:frame:button:1" content="Send" />
          <meta property="fc:frame:post_url" content="${req.protocol}://${req.get('host')}/submit" />
        </head>
      </html>
    `;
    res.set('Content-Type', 'text/html');
    res.send(html);
  }
});

// Handle Submissions
app.post('/submit', async (req, res) => {
  const input = req.body.untrustedData.inputText;
  const categoryMatch = input.match(/^\s*([1-4])/);
  const category = categoryMatch ? parseInt(categoryMatch[1]) : 1;
  const text = input.replace(/^\s*[1-4]\s*/, '');
  try {
    await axios.post(`${SUPABASE_URL}/rest/v1/jokes`, 
      { category, text, is_pro: false },
      { headers: { 'apikey': SUPABASE_KEY, 'Content-Type': 'application/json' } }
    );
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta property="og:image" content="https://i.imgur.com/h5H38OM.png" /> <!-- Using applause image as success -->
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="https://i.imgur.com/h5H38OM.png" />
          <meta property="fc:frame:button:1" content="Back" />
          <meta property="fc:frame:post_url" content="${req.protocol}://${req.get('host')}/" />
        </head>
      </html>
    `;
    res.set('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    res.set('Content-Type', 'text/html');
    res.send("Error submitting—try again!");
  }
});

app.listen(port, () => console.log(`Running on port ${port}`));