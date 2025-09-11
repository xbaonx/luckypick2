import { UserService } from './user.service';
import { User } from '../../entities/user.entity';
import { RegisterUserDto } from '../../dto/register-user.dto';
export declare class UserController {
    private readonly userService;
    constructor(userService: UserService);
    register(dto: RegisterUserDto): Promise<{
        success: boolean;
        user?: Partial<User>;
        error?: string;
    }>;
    getBalance(userId: string): Promise<{
        balanceFun: number;
        balanceUsdt: number;
    }>;
    getUser(userId: string): Promise<{
        id: string;
        userId: string;
        address: string;
        balanceFun: number;
        balanceUsdt: number;
        createdAt: Date;
    }>;
}
