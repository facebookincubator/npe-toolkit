/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import {BaseModel, Field, InverseField, Model, DeletedBy, Ref} from '../model';
import {
  CanRead,
  Exists,
  Privacy,
  AllowAll,
  DenyAll,
  MatchesUser,
  Authed,
  EvalInput,
  CanWrite,
  And,
} from '@toolkit/experimental/privacy/privacy';

@Model()
@Privacy({
  READ: AllowAll(),
  WRITE: MatchesUser('id'),
})
class User extends BaseModel {}

@Model()
@Privacy({'*': MatchesUser('id')})
class UserPrivate extends User {}

@Model()
abstract class Blob extends BaseModel {
  @Field() handle: string; // TODO: use `ExternalDeletableType`
}

namespace SocialNetwork {
  @Model()
  @DeletedBy(Ref('user1'), Ref('user2'))
  @Privacy({'*': [MatchesUser('user1'), MatchesUser('user2')]})
  class FriendConnection extends BaseModel {
    @Field() user1: User;
    @Field() user2: User;
    // id = user1.id + ':' + user2.id
  }

  @Model()
  @DeletedBy(Ref('user'))
  @Privacy({
    READ: And(
      Authed(),
      Exists(FriendConnection, ({ctx, obj}: EvalInput<Post>) => {
        return ctx.uid! < obj!.user.id
          ? `${ctx.uid}:${obj!.user.id}`
          : `${obj!.user.id}:${ctx.uid}`;
      }),
    ),
    WRITE: MatchesUser('user'),
  })
  class Post extends BaseModel {
    @Field() user: User;
    @Field() text?: string;
    @Field() photo?: Photo;
  }

  @Model()
  @DeletedBy(Ref('post'), Ref('user'))
  @Privacy({
    READ: And(Authed(), CanRead('post')),
    WRITE: MatchesUser('user'),
  })
  class Comment extends BaseModel {
    @Field() user: User;
    @Field() post: Post;
    @Field() text: string;
  }

  @Model()
  @DeletedBy(Ref('post'), Ref('comment'), Ref('user'))
  @Privacy({
    READ: And(Authed(), [CanRead('post'), CanRead('comment')]),
    WRITE: [MatchesUser('user')],
  })
  class Like extends BaseModel {
    @Field() post?: Post;
    @Field() comment?: Comment;
    @Field() user: User;
  }

  @Model()
  @DeletedBy(Ref(Post, 'post'), Ref('user'))
  @Privacy({
    READ: And(Authed(), CanRead(Post, 'photo')),
    WRITE: MatchesUser('user'),
  })
  class Photo extends Blob {
    @Field() user: User;
    @Field() url: string;
    @Field() thumbnailUrl?: string;
  }
}

namespace Chat {
  @Model()
  @DeletedBy(Ref('users', 'ALL_DELETED'))
  @Privacy({
    '*': MatchesUser('users'),
  })
  class Chat extends BaseModel {
    @Field() users: User[];
    @Field() name?: string;
  }

  @Model()
  @DeletedBy(Ref('user'))
  @Privacy({
    '*': MatchesUser('user'),
    READ: [MatchesUser('user'), CanRead('chat')],
  })
  class Message extends BaseModel {
    @Field() chat: Chat;
    @Field() user: User;
    @Field() text?: string;
    @Field() media?: Media;
  }

  @Model()
  @DeletedBy(Ref('user'), Ref(Message, 'media'))
  @Privacy({
    '*': MatchesUser('user'),
    READ: CanRead(Message, 'media'),
  })
  class Media extends Blob {
    @Field() type: 'photo' | 'video' | 'audio';
    @Field() user: User;
  }
}

namespace Forum {
  @Model()
  @Privacy({
    READ: Authed(),
    CREATE: Authed(),
  })
  class Topic extends BaseModel {
    @Field() name: string;
    @InverseField() questions: Question[];
  }

  @Model()
  @Privacy({
    READ: Authed(),
    WRITE: MatchesUser('author'),
  })
  class Question extends BaseModel {
    @Field() author: User;
    @Field() text: string;
    @Field({inverse: {field: 'questions', many: true}}) topic?: Topic;
    @InverseField() answers?: Answer[];
  }

  @Model()
  @Privacy({
    '*': [MatchesUser('author'), CanRead('question')],
  })
  class Answer extends BaseModel {
    @Field({inverse: {field: 'answers', many: true}}) question: Question;
    @Field() author: User;
    @Field() text: string;
  }
}

namespace PhotoSharing {}

namespace MusicStreaming {}

namespace VideoStreaming {}

namespace FileSharing {}

namespace ECommerse {}

namespace RideSharing {}
