export const registerUserSql = `
  INSERT INTO USERS (Name, Email, Phone_Number, User_Type)
  VALUES (:name, :email, :phone, :user_type)
  RETURNING User_ID INTO :id
`;
