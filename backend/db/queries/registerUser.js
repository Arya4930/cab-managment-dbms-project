export const registerUserSql = `
  INSERT INTO USERS (Name, Email, Password, Phone_Number, User_Type)
  VALUES (:name, :email, NVL(:password, '123456'), :phone, :user_type)
  RETURNING User_ID INTO :id
`;
