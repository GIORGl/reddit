import argon2 from "argon2";
import { MyContext } from "src/types";
import {
  Arg,
  Ctx,
  Field,
  InputType,
  Mutation,
  ObjectType,
  Query,
  Resolver,
} from "type-graphql";
import { COOKIE_NAME } from "../constants";
import { User } from "../entities/User";
// import session from "express-session";

@InputType()
class UsernamePasswordInput {
  @Field()
  username!: string;

  @Field()
  password: string;

  @Field()
  email: string;
}

@ObjectType()
class FieldError {
  @Field(() => String)
  field: string;

  @Field(() => String)
  message: string;
}

@ObjectType()
class UserResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];

  @Field(() => User, { nullable: true })
  user?: User;
}

@Resolver()
export class UserResolver {
  @Mutation(() => Boolean)
  async forgotPassword(@Arg("email") email: string, @Ctx() { em }: MyContext) {
    // const user = await em.findOne(User, { email });
    return true;
  }

  @Query(() => User, { nullable: true })
  async me(@Ctx() { req, em }: MyContext) {
    if (!req.session.userId) {
      return null;
    }
    const user = await em.findOne(User, { id: req.session.userId });

    return user;
  }

  @Mutation(() => UserResponse)
  async register(
    @Arg("options") { username, password, email }: UsernamePasswordInput,
    @Ctx() { em, req }: MyContext
  ): Promise<UserResponse> {
    if (username.length <= 2) {
      return {
        errors: [
          {
            field: "username",
            message: "Username lenght must be greater than 2!",
          },
        ],
      };
    }

    if (!email.includes("@")) {
      return {
        errors: [
          {
            field: "email",
            message: "Invalid Email",
          },
        ],
      };
    }

    if (password.length <= 6) {
      return {
        errors: [
          {
            field: "password",
            message: "password lenght must be greater than 2!",
          },
        ],
      };
    }

    const hasshedpassword = await argon2.hash(password);
    const user = em.create(User, {
      username,
      password: hasshedpassword,
      email,
      });

    try {
      await em.persistAndFlush(user);
    } catch (error) {
      const check =
        error.code === "23505" || error.detail.includes("already exists");

      //Duplicate user error
      return {
        errors: [
          {
            field: check ? "username" : "unknown",
            message: check
              ? "Username already taken!"
              : "somehting went wrong!",
          },
        ],
      };
    }
    req.session!.userId = user.id;
    return { user };
  }

  @Mutation(() => UserResponse)
  async login(
    @Arg("options") { username, password }: UsernamePasswordInput,
    @Ctx() { em, req }: MyContext
  ): Promise<UserResponse> {
    const user = await em.findOne(User, { username });

    if (!user) {
      return {
        errors: [
          {
            field: "usernameOrEmail",
            message: "that username doesn't exist",
          },
        ],
      };
    }

    const valid = await argon2.verify(user.password, password);

    if (!valid) {
      return {
        errors: [
          {
            field: "password",
            message: "incorrect password",
          },
        ],
      };
    }

    req.session!.userId = user.id;
    // const hasshedpassword = await argon2.hash(password);

    return {
      user,
    };
  }

  @Mutation(() => Boolean)
  logout(@Ctx() { req, res }: MyContext) {
    return new Promise((resolve) =>
      req.session.destroy((err) => {
        if (err) {
          console.log(err);
          resolve(false);
          return;
        }
        res.clearCookie(COOKIE_NAME);

        resolve(true);
        return;
      })
    );
  }
}
