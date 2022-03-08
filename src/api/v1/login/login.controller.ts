import { validationResult } from 'express-validator';
import { isNil, omit } from 'lodash';
import { Op } from 'sequelize';
import { JwtAuth, User } from '../../../db/models';
import { ApiMessages } from '../../shared/api-messages';
import { UserRequest, UserResponse } from '../user/user.interfaces';
import { SignInRequest, SignInResponse } from './login.interfaces';
import * as bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import config from '../../../../config/config';

/**
 * @swagger
 * /api/v1/signup:
 *   post:
 *     tags:
 *       - Login
 *     summary: 'Allow to register a user. User types: student, teacher'
 *     description: 'Allow to register a user. User types: student, teacher'
 *     requestBody:
 *       content:
 *         json:
 *           schema:
 *             $ref: '#/components/schemas/UserRequest'
 *     responses:
 *       200:
 *         content:
 *           json:
 *             schema:
 *               $ref: '#/components/schemas/UserResponse'
 */
export async function handleSignUp(req: UserRequest, res: UserResponse) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const body = req.body;

    const oldUser = await User.findOne({
        where: {
            [Op.or]: [{ login: body?.login }, { email: body?.email }],
        },
    });

    if (!isNil(oldUser)) {
        return res.status(400).json({ errors: ApiMessages.login.userExist });
    }

    try {
        const newUser = await User.create({
            login: body.login,
            email: body.email,
            firstName: body?.firstName ?? null,
            lastName: body?.lastName ?? null,
            password: body.password,
            role: body.role,
        });

        return res.json(omit(newUser.toJSON(), 'password') as any);
    } catch (err) {
        return res.status(500).json({ errors: ApiMessages.login.unableToCreateUser + err });
    }
}

/**
 * @swagger
 * /api/v1/signin:
 *   post:
 *     tags:
 *       - Login
 *     summary: Allow to sign into the app.
 *     requestBody:
 *       content:
 *         json:
 *           schema:
 *             $ref: '#/components/schemas/SignInRequest'
 *     responses:
 *       200:
 *         content:
 *           json:
 *             schema:
 *               $ref: '#/components/schemas/SignInResponse'
 *         description: return jwt token if credentials are correct
 */
export async function handleSignIn(req: SignInRequest, res: SignInResponse) {
    const { username, password } = req.body;

    let existentUser: any;
    try {
        existentUser = await User.findOne({
            raw: true,
            where: {
                [Op.or]: [
                    {
                        login: username,
                    },
                    {
                        email: username,
                    },
                ],
            },
        });
    } catch (err) {
        return res.status(500).json({ errors: ApiMessages.common.unexpectedError + `: ${err}` });
    }

    if (isNil(existentUser)) {
        return res.status(404).json({ errors: ApiMessages.user.noUser });
    }

    const verifiedPassword = await bcrypt.compare(password, (existentUser as any).password);
    if (!verifiedPassword) {
        return res.status(400).json({ errors: ApiMessages.login.wrongCredentials });
    }

    let createdToken: any;
    try {
        createdToken = await JwtAuth.findOne({
            raw: true,
            where: {
                userId: existentUser.id,
            },
        });

        if (!isNil(createdToken)) {
            const valid = jwt.verify(createdToken.jwt, config.jwtSecret);
            if (valid) {
                return res.status(200).json({ accessToken: createdToken.jwt });
            }
        }
    } catch (err: any) {
        if (err.toString().includes('TokenExpiredError')) {
            await JwtAuth.destroy({
                where: {
                    id: createdToken.id,
                },
            });
        } else {
            console.error({ errors: ApiMessages.common.unexpectedError + `: ${err}` });
        }
    }

    let token: string;
    try {
        token = jwt.sign({ username, role: existentUser.role }, config.jwtSecret, {
            expiresIn: config.jwtExpiresIn,
        });

        await JwtAuth.create({
            jwt: token,
            userId: existentUser?.id,
        });
    } catch (err) {
        return res.status(500).json({ errors: ApiMessages.common.unexpectedError + `: ${err}` });
    }

    return res.status(200).json({ accessToken: token });
}
