import { Entity, PrimaryKey, Property } from "@mikro-orm/core";
import { text } from "express";
import { Field, Int, ObjectType } from "type-graphql";

@ObjectType()
@Entity()
export class User {
  @Field(() => Int)
  @PrimaryKey()
  id!: number;

  @Field(() => String)
  @Property()
  createdAt: Date = new Date();

  @Field(() => String)
  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  @Field(() => String)
  @Property({ type: text, unique: true })
  username!: string;

  @Field(() => String)
  @Property({ type: text, unique: true })
  email!: string;

  @Field(() => String)
  @Property({ type: text, nullable: false })
  password!: string;
}
