import { Response } from 'express';

export class ApiResponse<T = unknown> {
  public readonly success: boolean;
  public readonly statusCode: number;
  public readonly message: string;
  public readonly data?: T;

  constructor(statusCode: number, message: string, data?: T) {
    this.success = statusCode < 400;
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
  }

  send(res: Response): Response {
    return res.status(this.statusCode).json({
      success: this.success,
      message: this.message,
      data: this.data,
    });
  }

  static ok<T>(res: Response, message: string, data?: T): Response {
    return new ApiResponse(200, message, data).send(res);
  }

  static created<T>(res: Response, message: string, data?: T): Response {
    return new ApiResponse(201, message, data).send(res);
  }

  static noContent(res: Response, message = 'Deleted successfully'): Response {
    return new ApiResponse(204, message).send(res);
  }
}
