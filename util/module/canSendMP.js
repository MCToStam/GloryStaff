async function canSendMP(client, userId) {
  try {
    const user = await client.users.fetch(userId);
    await user.createDM();
    return true;
  } catch (e) {
    return false;
  }
}

module.exports = canSendMP;
