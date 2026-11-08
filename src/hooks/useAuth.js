import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { userDetailsFetched } from "@/features/auth/authSlice";
import { useSelfDetailsQuery } from "@/features/auth/authApiSlice";

const useAuth = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  const {
    data,
    error,
    isError,
    isSuccess,
    isLoading,
    isFetching,
    refetch,
  } = useSelfDetailsQuery(undefined, {
    skip: !isAuthenticated,
  });

  const authChecked = !isAuthenticated || (isSuccess && data?.data);
  const authError = isAuthenticated && isError ? error : null;

  useEffect(() => {
    if (isAuthenticated && isSuccess && data?.data) {
      dispatch(userDetailsFetched(data.data));
    }
  }, [isSuccess, data, dispatch, isAuthenticated]);

  return {
    isLoading:
      isLoading || (isAuthenticated && !authChecked && !authError),
    isFetching,
    authChecked,
    authError,
    refetchProfile: refetch,
    user,
  };
};

export default useAuth;
