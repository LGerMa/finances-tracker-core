export const responseAdapter = (code: number, message: string, data: any) => {
  return { code, message, data };
};
