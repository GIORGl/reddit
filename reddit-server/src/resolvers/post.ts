import { Post } from "../entities/Post";
import { Arg, Ctx, Int, Mutation, Query, Resolver } from "type-graphql";
import { MyContext } from "../types";

@Resolver()
export class PostResolver {
  @Query(() => [Post])
  async getPosts(@Ctx() { em }: MyContext): Promise<Post[]> {
    // await sleep(3000);
    return em.find(Post, {});
  }

  @Query(() => Post, { nullable: true })
  getPost(
    @Arg("id", () => Int) id: number,
    @Ctx() { em }: MyContext
  ): Promise<Post | null> {
    return em.findOne(Post, { id });
  }

  @Mutation(() => Post)
  async createPost(
    @Arg("title", () => String) title: String,
    @Ctx() { em }: MyContext
  ): Promise<Post> {
    const post = em.create(Post, { title });
    await em.persistAndFlush(post);
    return post;
  }

  @Mutation(() => Post, { nullable: true })
  async updatePost(
    @Arg("id", () => Int) id: number,
    @Arg("title", () => String, { nullable: true }) title: string,
    @Ctx() { em }: MyContext
  ): Promise<Post | null> {
    const post = await em.findOne(Post, { id });
    if (!post) {
      return null;
    }

    if (typeof title !== undefined) {
      post.title = title;
      await em.persistAndFlush(post);
    }

    return post;
  }

  @Mutation(() => Post, { nullable: true })
  async deletePost(
    @Arg("id", () => Int) id: number,
    @Ctx() { em }: MyContext
  ): Promise<Boolean> {
    try {
      await em.nativeDelete(Post, { id });
    } catch (error) {
      return false;
    }

    return true;
  }
}
