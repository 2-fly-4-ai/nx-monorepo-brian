import Image from 'next/image';
import { useRouter } from 'next/router';
import React, { useState } from 'react';
import MainLayout from '../../layouts/MainLayout';
import { trpc } from '../../utils/trpc';
import { BiEdit } from 'react-icons/bi';
import { SlShareAlt } from 'react-icons/sl';
import { toast } from 'react-hot-toast';
import PostCardListUserProfile from 'libs/shared/ui/src/lib/post-card/post-card-list-userprofile';
import PostCardUserProfile from 'libs/shared/ui/src/lib/post-card/post-card-userprofile';
import { useSession } from 'next-auth/react';
import Modal from '../../components/Modal';
import LoadingSpinner from 'libs/shared/ui/src/lib/loading-spinner/loading-spinner';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NX_SUPABASE_PUBLIC_URL,
  process.env.NX_PUBLIC_SUPABASE_PUBLIC_KEY
);

const UserProfilePage = () => {
  const [showListView, setListView] = useState(false);
  const router = useRouter();
  console.warn(router?.query?.username);

  const currentUser = useSession();
  console.warn(router.query.username);

  const userProfile = trpc.user.getUserProfile.useQuery(
    {
      username: router.query.username as string,
    },
    {
      enabled: !!router.query.username,
    }
  );

  const userPosts = trpc.user.getUserPosts.useQuery(
    {
      username: router.query.username as string,
    },
    {
      enabled: !!router.query.username,
    }
  );

  const [objectImage, setObjectImage] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const userRoute = trpc.useContext().user;

  const uploadAvatar = trpc.user.uploadAvatar.useMutation({
    onSuccess: () => {
      if (userProfile.data?.username) {
        userRoute.getUserProfile.invalidate({
          username: userProfile.data?.username as string,
        });
        toast.success('avatar updated!');
      }
    },
  });

  const handleChangeImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && userProfile.data?.username) {
      const file = e.target.files[0]; //select only one image

      if (file.size > 1.5 * 1000000) {
        return toast.error('images size should not be greater than 1MB');
      }

      setObjectImage(URL.createObjectURL(file));

      const fileReader = new FileReader();

      fileReader.readAsDataURL(file);

      fileReader.onloadend = () => {
        if (fileReader.result && userProfile.data?.username) {
          uploadAvatar.mutate({
            imageAsDataUrl: fileReader.result as string,
            username: userProfile.data?.username,
          });
        }
      };
    }
  };

  const [isFollowModalOpen, setIsFollowModalOpen] = useState({
    isOpen: false,
    modalType: 'followers',
  });

  const followers = trpc.user.getAllFollowers.useQuery(
    {
      userId: userProfile?.data?.id as string,
    },
    {
      enabled: Boolean(userProfile?.data?.id),
    }
  );

  const following = trpc.user.getAllFollowing.useQuery(
    {
      userId: userProfile?.data?.id as string,
    },
    {
      enabled: Boolean(userProfile?.data?.id),
    }
  );

  const followUser = trpc.user.followUser.useMutation({
    onSuccess: () => {
      // we have to update out UI
      userRoute.getAllFollowers.invalidate();
      userRoute.getAllFollowing.invalidate();
      userRoute.getUserProfile.invalidate();
      toast.success('user followed');
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const unfollowUser = trpc.user.unfollowUser.useMutation({
    onSuccess: () => {
      userRoute.getAllFollowers.invalidate();
      userRoute.getAllFollowing.invalidate();
      userRoute.getUserProfile.invalidate();
      toast.success('user unfollowed');
    },
  });

  return (
    <MainLayout>
      {followers.isSuccess && following.isSuccess && (
        <Modal
          isOpen={isFollowModalOpen.isOpen}
          onClose={() =>
            setIsFollowModalOpen((pre) => ({ ...pre, isOpen: false }))
          }
        >
          <div className="flex w-full flex-col items-center justify-center space-y-4">
            {isFollowModalOpen.modalType === 'followers' && (
              <div className="flex w-full flex-col justify-center">
                <h3 className="my-2 p-2 text-xl">Followers</h3>
                {followers.data?.followedBy.map((user) => (
                  <div
                    key={user.id}
                    className="my-1 flex w-full items-center justify-between rounded-xl bg-gray-200 px-4 py-2"
                  >
                    <div>{user.name}</div>
                    <button
                      onClick={() =>
                        user.followedBy.length > 0
                          ? unfollowUser.mutate({
                              followingUserId: user.id,
                            })
                          : followUser.mutate({
                              followingUserId: user.id,
                            })
                      }
                      className="flex items-center space-x-3 rounded border border-gray-400/50 bg-white px-4 py-2 transition hover:border-gray-900 hover:text-gray-900"
                    >
                      {user.followedBy.length > 0 ? 'Unfollow' : 'Follow'}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {isFollowModalOpen.modalType === 'following' && (
              <div className="flex w-full flex-col justify-center">
                <h3 className="my-2 p-2 text-xl">Following</h3>
                {following.data?.followings.map((user) => (
                  <div
                    key={user.id}
                    className="my-1 flex w-full items-center justify-between rounded-xl bg-gray-200 px-4 py-2"
                  >
                    <div>{user.name}</div>
                    <div>
                      <button
                        onClick={() =>
                          unfollowUser.mutate({
                            followingUserId: user.id,
                          })
                        }
                        className="flex items-center space-x-3 rounded border border-gray-400/50 bg-white px-4 py-2 transition hover:border-gray-900 hover:text-gray-900"
                      >
                        Unfollow
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}
      <div className="flex h-full w-full items-center justify-center">
        <div className="my-10 flex h-full w-full flex-col items-center justify-center lg:max-w-screen-md xl:max-w-screen-lg">
          <div className="flex w-full flex-col rounded-md bg-white shadow-md">
            <div className="relative h-44 w-full rounded-md bg-gradient-to-r from-rose-100 to-teal-100">
              <div className="absolute -bottom-10 left-12">
                <div className="group relative h-28 w-28 rounded-full border-2 border-white bg-gray-100">
                  {currentUser.data?.user?.id === userProfile.data?.id && (
                    <label
                      htmlFor="avatarFile"
                      className="absolute z-10 flex h-full w-full cursor-pointer items-center justify-center rounded-full  transition group-hover:bg-black/40"
                    >
                      <BiEdit className="hidden text-3xl text-white group-hover:block" />
                      <input
                        type="file"
                        name="avatarFile"
                        id="avatarFile"
                        className="sr-only"
                        accept="image/*"
                        onChange={handleChangeImage}
                        multiple={false}
                      />
                    </label>
                  )}
                  {!objectImage && userProfile.data?.image && (
                    <img
                      src={userProfile.data?.image}
                      alt={userProfile.data?.name ?? ''}
                      className="h-full w-full rounded-full"
                    />
                  )}
                  {objectImage && (
                    <Image
                      src={objectImage}
                      alt={userProfile.data?.name ?? ''}
                      fill
                      className="rounded-full"
                    />
                  )}
                </div>
              </div>
            </div>
            <div className="mt-10 ml-12 flex flex-col space-y-0.5 rounded-b-3xl py-4">
              <div className="text-2xl font-semibold text-gray-800">
                {userProfile.data?.name}
              </div>
              <div className="text-gray-600">@{userProfile.data?.username}</div>
              <div className="text-gray-600">
                {userProfile.data?._count.posts} Posts
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() =>
                    setIsFollowModalOpen({
                      isOpen: true,
                      modalType: 'followers',
                    })
                  }
                  className="text-gray-700 hover:text-gray-900"
                >
                  <span className="text-gray-900">
                    {userProfile.data?._count.followedBy}
                  </span>{' '}
                  Followers
                </button>
                <button
                  onClick={() =>
                    setIsFollowModalOpen({
                      isOpen: true,
                      modalType: 'following',
                    })
                  }
                  className="text-gray-700 hover:text-gray-900"
                >
                  <span className="text-gray-900">
                    {userProfile.data?._count.followings}
                  </span>{' '}
                  Followings
                </button>
              </div>
              <div className="flex w-full justify-between items-center pr-4 space-x-4">
                <div className="flex gap-2 ">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      toast.success('URL copied to clipboard 🥳');
                    }}
                    className=" flex transform items-center space-x-3 rounded border border-gray-200 px-4 py-2 transition hover:border-gray-900 hover:text-gray-900 active:scale-95 "
                  >
                    <div>Share</div>
                    <div>
                      <SlShareAlt />
                    </div>
                  </button>
                  {userProfile.isSuccess && userProfile.data?.followedBy && (
                    <button
                      onClick={() => {
                        if (userProfile.data?.id) {
                          userProfile.data.followedBy.length > 0
                            ? unfollowUser.mutate({
                                followingUserId: userProfile.data?.id,
                              })
                            : followUser.mutate({
                                followingUserId: userProfile.data?.id,
                              });
                        }
                      }}
                      className="flex items-center space-x-3 rounded border border-gray-400/50 bg-white px-4 py-2 transition hover:border-gray-900 hover:text-gray-900"
                    >
                      {userProfile.data?.followedBy.length > 0
                        ? 'Unfollow'
                        : 'Follow'}
                    </button>
                  )}
                </div>
                <div className="ml-auto  flex">
                  {!showListView ? (
                    <button onClick={() => setListView(true)}>
                      {/* I need this button to set List view true when clicked */}
                      <svg
                        stroke="currentColor"
                        fill="currentColor"
                        stroke-width="0"
                        viewBox="0 0 20 20"
                        height="2em"
                        width="2em"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          fill-rule="evenodd"
                          d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                          clip-rule="evenodd"
                        ></path>
                      </svg>
                    </button>
                  ) : (
                    <button onClick={() => setListView(false)}>
                      {/* I need this button to set List view false when clicked */}
                      <svg
                        stroke="currentColor"
                        fill="currentColor"
                        stroke-width="0"
                        viewBox="0 0 20 20"
                        height="2em"
                        width="2em"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path>
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className=" my-8 w-full">
            <h2 className="text-4xl mr-auto  px-2">My Posts:</h2>
            {userPosts.isLoading && <LoadingSpinner />}

            <div
              className={`${
                showListView ? 'grid-cols-1' : 'grid-cols-3'
              } my-10  gap-8 grid w-full place-items-center`}
            >
              {userPosts.isSuccess &&
                userPosts.data?.posts.map((post) => (
                  <div className=" h-full">
                    {showListView ? (
                      <PostCardListUserProfile post={post} />
                    ) : (
                      <PostCardUserProfile post={post} />
                    )}
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default UserProfilePage;
