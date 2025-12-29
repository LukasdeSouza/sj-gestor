import { AuthLogin, AuthRegister } from "../interfaces/Auth";
import AuthRepository from "../repositories/AuthRepository";
import { AuthSchemas } from "../schemas/authSchema";
import { APIError } from "../utils/wrapException";
import jwt, { SignOptions } from "jsonwebtoken";
import { emailValidate } from "../utils/mask";
import messages from "../utils/messages";
import { StringValue } from "ms";
import bcrypt from "bcryptjs";

export default class AuthService {
  static async login(data: AuthLogin) {
    if (!emailValidate(data.email)) {
      throw new APIError(messages.customValidation.invalidMail);
    }

    const userExist = await AuthRepository.findUserByEmail(data.email);

    if (!userExist) {
      throw new Error("Usuário não encontrado!");
    }

    const senhaCorreta = await bcrypt.compare(data.password, userExist.password);
    if (!senhaCorreta) {
      throw new Error("Usuário ou senha incorretos!");
    }

    if (!userExist.password) {
      throw new Error("Erro interno: senha do usuário não encontrada!");
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET não está definido nas variáveis de ambiente!");
    }

    const jwtOptions: SignOptions = {
      expiresIn: (process.env.JWT_EXPIREIN || "1h") as StringValue, // Usar StringValue
    };

    const token = jwt.sign(
      {
        id: userExist.id,
        name: userExist.name,
        email: userExist.email,
        group: (userExist as any).group
          ? { id: (userExist as any).group.id, name: (userExist as any).group.name }
          : undefined,
      },
      process.env.JWT_SECRET,
      jwtOptions
    );

    return {
      token,
      user: {
        id: userExist.id,
        name: userExist.name,
        email: userExist.email,
        group: (userExist as any).group
          ? { id: (userExist as any).group.id, name: (userExist as any).group.name }
          : undefined,
      },
    };
  }

  static async register(data: AuthRegister) {

    const validatedData = AuthSchemas.register.safeParse(data);

    if (!validatedData.success) {
      throw new APIError(validatedData.error, 422);
    }

    validatedData.data.password = bcrypt.hashSync(validatedData.data.password);

    const userData = await AuthRepository.register(validatedData.data);

    return userData;
  }
}
