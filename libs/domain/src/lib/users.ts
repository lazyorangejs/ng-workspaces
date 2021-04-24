import { Email } from '@lazyorange/domain'
import { Opaque } from 'type-fest'
import { validate } from 'uuid'
import { makeEmail } from './common'

export type UserId = Opaque<string, 'user_id'>

export const makeUserId = (str: string): UserId => {
  if (!validate(str)) {
    throw new TypeError('UserId must be valid UUID v4')
  }
  return str as UserId
}

export type Username = Opaque<string, 'username'>

export const makeUsername = (str: string) => {
  if (str?.length < 4) {
    throw new Error('Username must be longer than 4 chars')
  }
  return str as Username
}

export type User = {
  id: UserId
  email: Email
  username?: Username
}

export type CreateUser = {
  username?: string
  email: string
  password: string
}

export const mapToUser = (doc: User): User => {
  return {
    id: makeUserId(doc.id),
    email: makeEmail(doc.email),
    username: makeUsername(doc.username),
  }
}

export interface IUserService {
  /**
   * Find a user by email, can be used to check does a user is exist with given email.
   *
   * @param {Email} email
   * @return {*}  {(Promise<User | null>)}
   * @memberof IUserService
   */
  findByEmail(email: Email, fields: UserFields): Promise<User | null>

  findById(id: UserId): Promise<User | null>

  /**
   * Create a user with given data, an unique id will be generated by service.
   *
   * @param {Partial<CreateUser>} data
   * @return {*}  {Promise<User>}
   * @memberof IUserService
   */
  createUser(data: Partial<CreateUser>): Promise<User>
}

export type UserFields = (keyof User)[]

// it does not provide any guarantee that there will be present all fields for type, must be updated manually
export const UserFieldsAll: UserFields = ['id', 'email', 'username']