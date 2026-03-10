const channelAccessToken = "s8gKR6LjQXfQKo6hO6mHltDSTV5Hd+L35YgsakR8Hf+v2NasB87Wbu2XMUVg7ZyJUKNFBLeNQ4Jg5ChThBN43MPsJKbcCYbDFtFVeEjWHJMxof0D2Mi4cQuFwz/USiKDCfOW7LFVD+7MmK5l6u3kPwdB04t89/1O/w1cDnyilFU="

// Step 1: First let's get the bot info and check if we can find followers
async function main() {
  // Get bot info
  console.log("Checking bot info...")
  const botRes = await fetch("https://api.line.me/v2/bot/info", {
    headers: { Authorization: `Bearer ${channelAccessToken}` },
  })
  const botInfo = await botRes.json()
  console.log("Bot:", botInfo.displayName || botInfo)

  // Try to get follower IDs (only works if user has added the bot)
  console.log("\nGetting follower IDs...")
  const followersRes = await fetch("https://api.line.me/v2/bot/followers/ids", {
    headers: { Authorization: `Bearer ${channelAccessToken}` },
  })
  const followers = await followersRes.json()
  console.log("Followers:", JSON.stringify(followers, null, 2))

  // Send to known user
  const userId = "Uf85767565eff7a7570bfb3e97224f8f4"
  console.log(`\nSending test message to ${userId}...`)
  await sendPush(userId)
}

async function sendPush(userId: string) {
  const res = await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${channelAccessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to: userId,
      messages: [
        {
          type: "text",
          text: "🚨 [SafeChild Alert]\n\nYour child shared sensitive information:\n• Full Name detected\n• Platform: Instagram\n• Risk: 75/100 (HIGH)\n\nPlease check in with your child.",
        },
      ],
    }),
  })

  if (res.ok) {
    console.log("LINE message sent successfully!")
  } else {
    const err = await res.json()
    console.error("Failed:", res.status, JSON.stringify(err, null, 2))
  }
}

main()
