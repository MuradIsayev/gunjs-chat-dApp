<script>
  import Login from './Login.svelte';
  import ChatMessage from './ChatMessage.svelte';
  import { user, username } from './user';
  import { onMount } from 'svelte';
  import debounce from 'lodash.debounce';

  import GUN from 'gun';
  import SEA from 'gun/sea';
  const db = GUN();

  let newMessage;
  let messages = [];

  let scrollBottom;
  let lastScrollTop;
  let canAutoScroll = true;
  let unreadMessages = false;

  function autoScroll() {
    setTimeout(() => scrollBottom?.scrollIntoView({ behavior: 'auto' }), 50);
    unreadMessages = false;
  }

  function watchScroll(e) {
    canAutoScroll = (e.target.scrollTop || Infinity) > lastScrollTop;
    lastScrollTop = e.target.scrollTop;
  }

  $: debouncedWatchScroll = debounce(watchScroll, 1000);

  onMount(() => {
    var match = {
      // lexical queries are kind of like a limited RegEx or Glob.
      '.': {
        // property selector
        '>': new Date(+new Date() - 1 * 1000 * 60 * 60 * 3).toISOString() // find any indexed property larger ~3 hours ago
      },
      '-': 1 // filter in reverse
    };
  });

  onMount(() => {
    db.get('chat')
      .map()
      .once(async (data, id) => {
        if (data) {
          // Key for end-to-end encryption
          const key = '#endToEndEncryptionKey';

          var message = {
            // transform the data into a message object
            who: await db.user(data).get('alias'),
            what: (await SEA.decrypt(data.what, key)) + '',
            when: GUN.state.is(data, 'what')
          };

          if (message.what) {
            messages = [...messages.slice(-100), message].sort(
              (a, b) => a.when - b.when
            );
            if (canAutoScroll) {
              autoScroll();
            } else {
              unreadMessages = true;
            }
          }
        }
      });
  });

  async function sendMessage() {
    const secret = await SEA.encrypt(newMessage, '#endToEndEncryptionKey'); // encrypt the message
    const message = user.get('all').set({ what: secret }); // put the encrypted message into gun
    const index = new Date().toISOString(); // use the timestamp as the index
    db.get('chat').get(index).put(message); // add the message to the chat index
    newMessage = '';
    canAutoScroll = true;
    autoScroll();
  }
</script>

<div class="container">
  {#if $username}
    <main on:scroll={debouncedWatchScroll}>
      {#each messages as message (message.when)}
        <ChatMessage {message} sender={$username} />
      {/each}

      <div class="dummy" bind:this={scrollBottom} />
    </main>

    <form on:submit|preventDefault={sendMessage}>
      <input
        type="text"
        placeholder="Type a message..."
        bind:value={newMessage}
        maxlength="100"
      />

      <button type="submit" disabled={!newMessage}>💥</button>
    </form>

    {#if !canAutoScroll}
      <div class="scroll-button">
        <button on:click={autoScroll} class:red={unreadMessages}>
          {#if unreadMessages}
            💬
          {/if}

          👇
        </button>
      </div>
    {/if}
  {:else}
    <main>
      <Login />
    </main>
  {/if}
</div>
