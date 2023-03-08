import { Dispatch, SetStateAction } from 'react';
import { CookieSetOptions } from 'universal-cookie';
import { IAuth } from './interfaces';

export type SetCookie = (name: 'bearer', value: any, options?: CookieSetOptions) => void;

export type RemoveCookie = (name: 'bearer', options?: CookieSetOptions) => void;

export type SetAuth = Dispatch<SetStateAction<IAuth>>;
