import Array "mo:core/Array";
import List "mo:core/List";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Order "mo:core/Order";
import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import Iter "mo:core/Iter";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Blob "mo:core/Blob";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";

actor {
  include MixinStorage();

  // STATE
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // TYPES
  public type MediaType = {
    #text;
    #image;
    #video;
    #audio;
    #voice;
    #gif;
    #sticker;
    #emoji;
  };

  public type MessageStatus = {
    #sent;
    #received;
    #read;
    #deleted;
  };

  public type Gender = {
    #male;
    #female;
    #other;
  };

  public type UserProfile = {
    id : Principal;
    phoneNumber : Text;
    displayName : Text;
    gender : Gender;
    address : Text;
    dateOfBirth : Int;
    profilePicture : ?Storage.ExternalBlob;
    createdAt : Int;
  };

  public type Contact = {
    owner : Principal;
    phoneNumber : Text;
    contactLabel : Text;
    displayName : Text;
  };

  public type Conversation = {
    id : Text;
    name : Text;
    description : Text;
    isGroup : Bool;
    members : [Principal];
    createdAt : Int;
  };

  public type Message = {
    id : Text;
    conversationId : Text;
    sender : Principal;
    content : Text;
    mediaType : MediaType;
    media : ?Storage.ExternalBlob;
    status : MessageStatus;
    timestamp : Int;
  };

  public type Reaction = {
    id : Text;
    messageId : Text;
    userId : Principal;
    emoji : Text;
    timestamp : Int;
  };

  public type ConversationSummary = {
    conversation : Conversation;
    lastMessage : ?Message;
    unreadCount : Nat;
  };

  // COMPARATORS
  module Message {
    public func compare(a : Message, b : Message) : Order.Order {
      Nat.compare(
        b.timestamp.toNat(),
        a.timestamp.toNat(),
      );
    };
  };

  module ConversationSummary {
    public func compare(a : ConversationSummary, b : ConversationSummary) : Order.Order {
      switch (a.lastMessage, b.lastMessage) {
        case (null, null) { #equal };
        case (null, _) { #greater };
        case (_, null) { #less };
        case (?aMsg, ?bMsg) {
          Nat.compare(
            bMsg.timestamp.toNat(),
            aMsg.timestamp.toNat(),
          );
        };
      };
    };
  };

  // STORAGE
  let users = Map.empty<Principal, UserProfile>();
  let contacts = Map.empty<Principal, List.List<Contact>>();
  let conversations = Map.empty<Text, Conversation>();
  let messages = Map.empty<Text, List.List<Message>>();
  let reactions = Map.empty<Text, List.List<Reaction>>();

  // HELPERS
  func getUserByPhone(phone : Text) : ?UserProfile {
    let iter = users.values();
    let filteredIter = iter.filter(
      func(user) {
        user.phoneNumber == phone;
      }
    );
    filteredIter.next();
  };

  // REQUIRED PROFILE FUNCTIONS
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    users.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    users.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    users.add(caller, profile);
  };

  // USER MANAGEMENT
  public shared ({ caller }) func registerUser(phoneNumber : Text, displayName : Text, gender : Gender, address : Text, dateOfBirth : Int, profilePicture : ?Storage.ExternalBlob) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can register");
    };

    let user : UserProfile = {
      id = caller;
      phoneNumber;
      displayName;
      gender;
      address;
      dateOfBirth;
      profilePicture;
      createdAt = Time.now();
    };
    users.add(caller, user);
  };

  public shared ({ caller }) func updateUser(displayName : Text, gender : Gender, address : Text, profilePicture : ?Storage.ExternalBlob) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update profiles");
    };

    let existingUser = switch (users.get(caller)) {
      case (null) { Runtime.trap("User not found") };
      case (?user) { user };
    };

    let updatedUser : UserProfile = {
      id = existingUser.id;
      phoneNumber = existingUser.phoneNumber;
      displayName;
      gender;
      address;
      dateOfBirth = existingUser.dateOfBirth;
      profilePicture;
      createdAt = existingUser.createdAt;
    };
    users.add(caller, updatedUser);
  };

  public query ({ caller }) func getProfile() : async UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };

    switch (users.get(caller)) {
      case (null) { Runtime.trap("User not found") };
      case (?user) { user };
    };
  };

  // CONTACTS
  public shared ({ caller }) func addContact(phoneNumber : Text, contactLabel : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add contacts");
    };

    let existingContacts = switch (contacts.get(caller)) {
      case (null) { List.empty<Contact>() };
      case (?contacts) { contacts };
    };

    let contact : Contact = {
      owner = caller;
      phoneNumber;
      contactLabel;
      displayName = switch (getUserByPhone(phoneNumber)) {
        case (?user) { user.displayName };
        case (null) { "" };
      };
    };

    let newContacts = List.empty<Contact>();
    newContacts.add(contact);
    for (existingContact in existingContacts.values()) {
      newContacts.add(existingContact);
    };

    contacts.add(caller, newContacts);
  };

  public shared ({ caller }) func removeContact(phoneNumber : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can remove contacts");
    };

    switch (contacts.get(caller)) {
      case (null) { Runtime.trap("No contacts found") };
      case (?existingContacts) {
        let filteredContacts = existingContacts.filter(
          func(contact) {
            contact.phoneNumber != phoneNumber;
          }
        );
        contacts.add(caller, filteredContacts);
      };
    };
  };

  public query ({ caller }) func getContacts() : async [Contact] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view contacts");
    };

    switch (contacts.get(caller)) {
      case (null) { [] };
      case (?contacts) { contacts.toArray() };
    };
  };

  // USER SEARCH
  public query ({ caller }) func searchUsersByDisplayName(name : Text) : async [UserProfile] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can search");
    };

    users.values().toArray().filter(
      func(user) {
        user.displayName.contains(#text name);
      }
    );
  };

  public query ({ caller }) func searchUsersByPhoneNumber(phoneNumber : Text) : async [UserProfile] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can search");
    };

    users.values().toArray().filter(
      func(user) {
        user.phoneNumber.contains(#text phoneNumber);
      }
    );
  };

  // CONVERSATIONS
  public shared ({ caller }) func createConversation(name : Text, description : Text, isGroup : Bool, members : [Principal]) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create conversations");
    };

    // Verify caller is in the members list
    if (not isMember(caller, members)) {
      Runtime.trap("Unauthorized: Creator must be a member of the conversation");
    };

    let conversationId = "conv_" # Time.now().toText();
    let conversation : Conversation = {
      id = conversationId;
      name;
      description;
      isGroup;
      members;
      createdAt = Time.now();
    };

    conversations.add(conversationId, conversation);
    conversationId;
  };

  func isMember(caller : Principal, members : [Principal]) : Bool {
    let iter = members.values();
    let filtered = iter.filter(func(member) { member == caller });
    switch (filtered.next()) {
      case (null) { false };
      case (?member) { member == caller };
    };
  };

  public query ({ caller }) func getConversation(conversationId : Text) : async Conversation {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view conversations");
    };

    switch (conversations.get(conversationId)) {
      case (null) { Runtime.trap("Conversation not found") };
      case (?conversation) {
        if (not isMember(caller, conversation.members)) {
          Runtime.trap("Unauthorized: Not a member of this conversation");
        };
        conversation;
      };
    };
  };

  public shared ({ caller }) func addMember(conversationId : Text, member : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add members");
    };

    switch (conversations.get(conversationId)) {
      case (null) { Runtime.trap("Conversation not found") };
      case (?conversation) {
        if (not isMember(caller, conversation.members)) {
          Runtime.trap("Unauthorized: Not a member of this conversation");
        };
        if (not conversation.isGroup) {
          Runtime.trap("Cannot add members to 1-on-1 conversations");
        };
        let newMembers = conversation.members.concat([member]);
        let updatedConversation : Conversation = {
          id = conversation.id;
          name = conversation.name;
          description = conversation.description;
          isGroup = conversation.isGroup;
          members = newMembers;
          createdAt = conversation.createdAt;
        };
        conversations.add(conversationId, updatedConversation);
      };
    };
  };

  public shared ({ caller }) func removeMember(conversationId : Text, member : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can remove members");
    };

    switch (conversations.get(conversationId)) {
      case (null) { Runtime.trap("Conversation not found") };
      case (?conversation) {
        if (not isMember(caller, conversation.members)) {
          Runtime.trap("Unauthorized: Not a member of this conversation");
        };
        if (not conversation.isGroup) {
          Runtime.trap("Cannot remove members from 1-on-1 conversations");
        };
        let newMembers = conversation.members.filter(func(m) { m != member });
        let updatedConversation : Conversation = {
          id = conversation.id;
          name = conversation.name;
          description = conversation.description;
          isGroup = conversation.isGroup;
          members = newMembers;
          createdAt = conversation.createdAt;
        };
        conversations.add(conversationId, updatedConversation);
      };
    };
  };

  public shared ({ caller }) func leaveConversation(conversationId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can leave conversations");
    };

    switch (conversations.get(conversationId)) {
      case (null) { Runtime.trap("Conversation not found") };
      case (?conversation) {
        if (not isMember(caller, conversation.members)) {
          Runtime.trap("Unauthorized: Not a member of this conversation");
        };
        let newMembers = conversation.members.filter(func(m) { m != caller });
        let updatedConversation : Conversation = {
          id = conversation.id;
          name = conversation.name;
          description = conversation.description;
          isGroup = conversation.isGroup;
          members = newMembers;
          createdAt = conversation.createdAt;
        };
        conversations.add(conversationId, updatedConversation);
      };
    };
  };

  public query ({ caller }) func getConversations() : async [ConversationSummary] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view conversations");
    };

    let userConversations = conversations.toArray().map(
      func(pair) {
        let conv = pair.1;
        if (isMember(caller, conv.members)) { ?conv } else { null };
      }
    );

    let filteredConversations = userConversations.filter(
      func(conv) {
        conv != null
      }
    );

    filteredConversations.map(
      func(maybeConv) {
        let conv = switch (maybeConv) {
          case (null) { Runtime.trap("Unexpected null conversation") };
          case (?c) { c };
        };
        let convMessages = switch (messages.get(conv.id)) {
          case (null) { List.empty<Message>() };
          case (?msgs) { msgs };
        };

        let lastMsg = convMessages.first();

        {
          conversation = conv;
          lastMessage = lastMsg;
          unreadCount = 0;
        };
      }
    );
  };

  // MESSAGES
  public shared ({ caller }) func sendMessage(conversationId : Text, content : Text, mediaType : MediaType, media : ?Storage.ExternalBlob) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can send messages");
    };

    switch (conversations.get(conversationId)) {
      case (null) { Runtime.trap("Conversation not found") };
      case (?conversation) {
        if (not isMember(caller, conversation.members)) {
          Runtime.trap("Unauthorized: Not a member of this conversation");
        };
        let msgId = "msg_" # Time.now().toText();
        let message : Message = {
          id = msgId;
          conversationId;
          sender = caller;
          content;
          mediaType;
          media;
          status = #sent;
          timestamp = Time.now();
        };

        let existingMessages = switch (messages.get(conversationId)) {
          case (null) { List.empty<Message>() };
          case (?msgs) { msgs };
        };
        existingMessages.add(message);
        messages.add(conversationId, existingMessages);
        msgId;
      };
    };
  };

  public query ({ caller }) func getMessages(conversationId : Text, limit : Nat, offset : Nat) : async [Message] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view messages");
    };

    switch (conversations.get(conversationId)) {
      case (null) { Runtime.trap("Conversation not found") };
      case (?conversation) {
        if (not isMember(caller, conversation.members)) {
          Runtime.trap("Unauthorized: Not a member of this conversation");
        };

        switch (messages.get(conversationId)) {
          case (null) { [] };
          case (?msgs) {
            let allMessages = msgs.toArray().sort();
            let start = offset;
            let end = Nat.min(start + limit, allMessages.size());
            if (start >= allMessages.size()) { return [] };
            allMessages.sliceToArray(start, end);
          };
        };
      };
    };
  };

  public shared ({ caller }) func updateMessageStatus(messageId : Text, status : MessageStatus) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update message status");
    };

    // Find the message across all conversations
    let allConvs = conversations.toArray();
    for ((convId, conv) in allConvs.values()) {
      switch (messages.get(convId)) {
        case (null) {};
        case (?msgs) {
          let msgArray = msgs.toArray();
          let foundMsg = msgArray.find(func(m) { m.id == messageId });
          switch (foundMsg) {
            case (null) {};
            case (?msg) {
              // Verify caller is a member of the conversation
              if (not isMember(caller, conv.members)) {
                Runtime.trap("Unauthorized: Not a member of this conversation");
              };

              // Update the message
              let updatedMsg : Message = {
                id = msg.id;
                conversationId = msg.conversationId;
                sender = msg.sender;
                content = msg.content;
                mediaType = msg.mediaType;
                media = msg.media;
                status = status;
                timestamp = msg.timestamp;
              };

              let newMsgList = List.empty<Message>();
              for (m in msgs.values()) {
                if (m.id == messageId) {
                  newMsgList.add(updatedMsg);
                } else {
                  newMsgList.add(m);
                };
              };
              messages.add(convId, newMsgList);
              return;
            };
          };
        };
      };
    };
    Runtime.trap("Message not found");
  };

  public shared ({ caller }) func deleteMessage(messageId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete messages");
    };

    // Find and delete the message
    let allConvs = conversations.toArray();
    for ((convId, conv) in allConvs.values()) {
      switch (messages.get(convId)) {
        case (null) {};
        case (?msgs) {
          let msgArray = msgs.toArray();
          let foundMsg = msgArray.find(func(m) { m.id == messageId });
          switch (foundMsg) {
            case (null) {};
            case (?msg) {
              // Verify caller is the sender or admin
              if (msg.sender != caller and not AccessControl.isAdmin(accessControlState, caller)) {
                Runtime.trap("Unauthorized: Can only delete your own messages");
              };

              // Soft delete by updating status
              let updatedMsg : Message = {
                id = msg.id;
                conversationId = msg.conversationId;
                sender = msg.sender;
                content = msg.content;
                mediaType = msg.mediaType;
                media = msg.media;
                status = #deleted;
                timestamp = msg.timestamp;
              };

              let newMsgList = List.empty<Message>();
              for (m in msgs.values()) {
                if (m.id == messageId) {
                  newMsgList.add(updatedMsg);
                } else {
                  newMsgList.add(m);
                };
              };
              messages.add(convId, newMsgList);
              return;
            };
          };
        };
      };
    };
    Runtime.trap("Message not found");
  };

  // REACTIONS
  public shared ({ caller }) func addReaction(messageId : Text, emoji : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add reactions");
    };

    let reactionId = "react_" # Time.now().toText();

    let reaction : Reaction = {
      id = reactionId;
      messageId;
      userId = caller;
      emoji;
      timestamp = Time.now();
    };

    let existingReactions = switch (reactions.get(messageId)) {
      case (null) { List.empty<Reaction>() };
      case (?reacts) { reacts };
    };
    existingReactions.add(reaction);
    reactions.add(messageId, existingReactions);
    reactionId;
  };

  public shared ({ caller }) func removeReaction(reactionId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can remove reactions");
    };

    let matchingMsg = reactions.toArray().find(
      func((_, reacts)) {
        reacts.toArray().find(
          func(react) {
            react.id == reactionId;
          }
        ) != null;
      }
    );

    switch (matchingMsg) {
      case (null) { Runtime.trap("Reaction not found") };
      case (?msg) {
        let (messageId, reacts) = msg;

        // Verify caller owns the reaction or is admin
        let reaction = reacts.toArray().find(func(r) { r.id == reactionId });
        switch (reaction) {
          case (null) { Runtime.trap("Reaction not found") };
          case (?r) {
            if (r.userId != caller and not AccessControl.isAdmin(accessControlState, caller)) {
              Runtime.trap("Unauthorized: Can only remove your own reactions");
            };
          };
        };

        let filteredReacts = reacts.filter(func(react) { react.id != reactionId });
        reactions.add(messageId, filteredReacts);
      };
    };
  };

  public query ({ caller }) func getReactions(messageId : Text) : async [Reaction] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view reactions");
    };

    switch (reactions.get(messageId)) {
      case (null) { [] };
      case (?reacts) { reacts.toArray() };
    };
  };

  // NOTIFICATIONS
  public query ({ caller }) func getUnreadCounts() : async [(Text, Nat)] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view unread counts");
    };

    let userConversations = conversations.toArray().map(
      func(pair) {
        let conv = pair.1;
        if (isMember(caller, conv.members)) { ?conv } else { null };
      }
    );

    userConversations.filter(
      func(conv) {
        conv != null
      }
    ).map(
      func(maybeConv) {
        let conv = switch (maybeConv) {
          case (null) { Runtime.trap("Unexpected null conversation") };
          case (?c) { c };
        };
        (conv.id, 0);
      }
    );
  };

  public query ({ caller }) func getTotalUnread() : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view unread counts");
    };

    0;
  };

  public shared ({ caller }) func markConversationAsRead(conversationId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can mark conversations as read");
    };

    switch (conversations.get(conversationId)) {
      case (null) { Runtime.trap("Conversation not found") };
      case (?conversation) {
        if (not isMember(caller, conversation.members)) {
          Runtime.trap("Unauthorized: Not a member of this conversation");
        };
        // Implementation would update unread counts (currently stubbed)
      };
    };
  };
};
