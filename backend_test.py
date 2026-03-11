#!/usr/bin/env python3
"""
AI Course Builder - Backend API Testing
Tests all backend endpoints with authentication flow
"""

import requests
import json
import sys
import time
from datetime import datetime
import subprocess

class CourseBuilderAPITester:
    def __init__(self, base_url="https://e2ec0b73-865a-443e-8d58-cb14dd92f904.preview.emergentagent.com"):
        self.base_url = base_url
        self.session_token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            status = "✅ PASS"
        else:
            status = "❌ FAIL"
        
        result = {
            "name": name,
            "success": success,
            "details": details
        }
        self.test_results.append(result)
        print(f"{status} {name}: {details}")

    def test_health_endpoint(self):
        """Test health check endpoint"""
        try:
            response = requests.get(f"{self.base_url}/api/health", timeout=10)
            success = response.status_code == 200
            if success:
                data = response.json()
                details = f"Status: {data.get('status')} - {response.status_code}"
            else:
                details = f"Unexpected status code: {response.status_code}"
        except Exception as e:
            success = False
            details = f"Request failed: {str(e)}"
        
        self.log_test("Health Endpoint", success, details)
        return success

    def create_test_user_session(self):
        """Create test user and session using mongosh"""
        try:
            mongo_script = """
            use('ai_course_builder');
            var userId = 'test-user-' + Date.now();
            var sessionToken = 'test_session_' + Date.now();
            db.users.insertOne({
              user_id: userId,
              email: 'test.user.' + Date.now() + '@example.com',
              name: 'Test User',
              picture: 'https://via.placeholder.com/150',
              created_at: new Date()
            });
            db.user_sessions.insertOne({
              user_id: userId,
              session_token: sessionToken,
              expires_at: new Date(Date.now() + 7*24*60*60*1000),
              created_at: new Date()
            });
            print(JSON.stringify({session_token: sessionToken, user_id: userId}));
            """
            
            result = subprocess.run(
                ['mongosh', '--eval', mongo_script, '--quiet'],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0:
                # Find JSON output in the result
                lines = result.stdout.strip().split('\n')
                for line in lines:
                    if line.strip().startswith('{'):
                        data = json.loads(line.strip())
                        self.session_token = data['session_token']
                        self.user_id = data['user_id']
                        self.log_test("Create Test User", True, f"User ID: {self.user_id}")
                        return True
            
            self.log_test("Create Test User", False, f"MongoDB error: {result.stderr}")
            return False
            
        except Exception as e:
            self.log_test("Create Test User", False, f"Error: {str(e)}")
            return False

    def test_auth_me_endpoint(self):
        """Test /api/auth/me endpoint"""
        if not self.session_token:
            self.log_test("Auth Me Endpoint", False, "No session token available")
            return False
        
        try:
            response = requests.get(
                f"{self.base_url}/api/auth/me",
                headers={"Authorization": f"Bearer {self.session_token}"},
                timeout=10
            )
            
            success = response.status_code == 200
            if success:
                data = response.json()
                details = f"User: {data.get('name')} ({data.get('email')})"
            else:
                details = f"Status: {response.status_code}, Response: {response.text[:100]}"
                
        except Exception as e:
            success = False
            details = f"Request failed: {str(e)}"
        
        self.log_test("Auth Me Endpoint", success, details)
        return success

    def test_get_courses_empty(self):
        """Test GET /api/courses (should be empty for new user)"""
        if not self.session_token:
            self.log_test("Get Courses (Empty)", False, "No session token available")
            return False
        
        try:
            response = requests.get(
                f"{self.base_url}/api/courses",
                headers={"Authorization": f"Bearer {self.session_token}"},
                timeout=10
            )
            
            success = response.status_code == 200
            if success:
                data = response.json()
                details = f"Courses count: {len(data)}"
            else:
                details = f"Status: {response.status_code}"
                
        except Exception as e:
            success = False
            details = f"Request failed: {str(e)}"
        
        self.log_test("Get Courses (Empty)", success, details)
        return success

    def test_course_generation(self):
        """Test POST /api/courses/generate"""
        if not self.session_token:
            self.log_test("Course Generation", False, "No session token available")
            return False
        
        try:
            course_data = {
                "prompt": "Basic Python programming",
                "difficulty": "beginner",
                "num_lessons": 3
            }
            
            print("🔄 Generating course (this may take 30-60 seconds)...")
            response = requests.post(
                f"{self.base_url}/api/courses/generate",
                headers={
                    "Authorization": f"Bearer {self.session_token}",
                    "Content-Type": "application/json"
                },
                json=course_data,
                timeout=120  # Extended timeout for AI generation
            )
            
            success = response.status_code == 200
            if success:
                data = response.json()
                self.course_id = data.get('course_id')
                details = f"Course created: {data.get('title')} with {len(data.get('lessons', []))} lessons"
            else:
                details = f"Status: {response.status_code}, Response: {response.text[:200]}"
                
        except Exception as e:
            success = False
            details = f"Request failed: {str(e)}"
        
        self.log_test("Course Generation", success, details)
        return success

    def test_get_specific_course(self):
        """Test GET /api/courses/{course_id}"""
        if not self.session_token:
            self.log_test("Get Specific Course", False, "No session token available")
            return False
            
        if not hasattr(self, 'course_id') or not self.course_id:
            self.log_test("Get Specific Course", False, "No course ID from generation")
            return False
        
        try:
            response = requests.get(
                f"{self.base_url}/api/courses/{self.course_id}",
                headers={"Authorization": f"Bearer {self.session_token}"},
                timeout=10
            )
            
            success = response.status_code == 200
            if success:
                data = response.json()
                details = f"Course: {data.get('title')}, Progress: {data.get('progress', {}).get('percent_complete', 0)}%"
            else:
                details = f"Status: {response.status_code}"
                
        except Exception as e:
            success = False
            details = f"Request failed: {str(e)}"
        
        self.log_test("Get Specific Course", success, details)
        return success

    def test_update_progress(self):
        """Test POST /api/progress/update"""
        if not self.session_token:
            self.log_test("Update Progress", False, "No session token available")
            return False
            
        if not hasattr(self, 'course_id') or not self.course_id:
            self.log_test("Update Progress", False, "No course ID available")
            return False
        
        try:
            # First get the course to find a lesson ID
            course_response = requests.get(
                f"{self.base_url}/api/courses/{self.course_id}",
                headers={"Authorization": f"Bearer {self.session_token}"}
            )
            
            if course_response.status_code != 200:
                self.log_test("Update Progress", False, "Could not fetch course for lesson ID")
                return False
                
            course_data = course_response.json()
            if not course_data.get('lessons'):
                self.log_test("Update Progress", False, "No lessons found in course")
                return False
                
            lesson_id = course_data['lessons'][0]['lesson_id']
            
            # Update progress
            progress_data = {
                "course_id": self.course_id,
                "lesson_id": lesson_id,
                "completed": True,
                "quiz_score": 85
            }
            
            response = requests.post(
                f"{self.base_url}/api/progress/update",
                headers={
                    "Authorization": f"Bearer {self.session_token}",
                    "Content-Type": "application/json"
                },
                json=progress_data,
                timeout=10
            )
            
            success = response.status_code == 200
            if success:
                data = response.json()
                details = f"Progress updated: {data.get('percent_complete', 0)}% complete"
            else:
                details = f"Status: {response.status_code}"
                
        except Exception as e:
            success = False
            details = f"Request failed: {str(e)}"
        
        self.log_test("Update Progress", success, details)
        return success

    def test_get_progress(self):
        """Test GET /api/progress/{course_id}"""
        if not self.session_token:
            self.log_test("Get Progress", False, "No session token available")
            return False
            
        if not hasattr(self, 'course_id') or not self.course_id:
            self.log_test("Get Progress", False, "No course ID available")
            return False
        
        try:
            response = requests.get(
                f"{self.base_url}/api/progress/{self.course_id}",
                headers={"Authorization": f"Bearer {self.session_token}"},
                timeout=10
            )
            
            success = response.status_code == 200
            if success:
                data = response.json()
                details = f"Progress: {len(data.get('completed_lessons', []))} lessons completed, {data.get('percent_complete', 0)}%"
            else:
                details = f"Status: {response.status_code}"
                
        except Exception as e:
            success = False
            details = f"Request failed: {str(e)}"
        
        self.log_test("Get Progress", success, details)
        return success

    def test_delete_course(self):
        """Test DELETE /api/courses/{course_id}"""
        if not self.session_token:
            self.log_test("Delete Course", False, "No session token available")
            return False
            
        if not hasattr(self, 'course_id') or not self.course_id:
            self.log_test("Delete Course", False, "No course ID available")
            return False
        
        try:
            response = requests.delete(
                f"{self.base_url}/api/courses/{self.course_id}",
                headers={"Authorization": f"Bearer {self.session_token}"},
                timeout=10
            )
            
            success = response.status_code == 200
            if success:
                details = "Course deleted successfully"
            else:
                details = f"Status: {response.status_code}"
                
        except Exception as e:
            success = False
            details = f"Request failed: {str(e)}"
        
        self.log_test("Delete Course", success, details)
        return success

    def test_logout(self):
        """Test POST /api/auth/logout"""
        if not self.session_token:
            self.log_test("Logout", False, "No session token available")
            return False
        
        try:
            response = requests.post(
                f"{self.base_url}/api/auth/logout",
                headers={"Authorization": f"Bearer {self.session_token}"},
                timeout=10
            )
            
            success = response.status_code == 200
            if success:
                details = "Logout successful"
            else:
                details = f"Status: {response.status_code}"
                
        except Exception as e:
            success = False
            details = f"Request failed: {str(e)}"
        
        self.log_test("Logout", success, details)
        return success

    def cleanup_test_data(self):
        """Clean up test data from MongoDB"""
        try:
            if self.user_id:
                mongo_script = f"""
                use('ai_course_builder');
                db.users.deleteOne({{user_id: '{self.user_id}'}});
                db.user_sessions.deleteMany({{user_id: '{self.user_id}'}});
                db.courses.deleteMany({{user_id: '{self.user_id}'}});
                db.progress.deleteMany({{user_id: '{self.user_id}'}});
                print('Cleaned up test data');
                """
                
                subprocess.run(
                    ['mongosh', '--eval', mongo_script, '--quiet'],
                    timeout=30
                )
                print("🧹 Test data cleaned up")
        except Exception as e:
            print(f"⚠️  Cleanup warning: {str(e)}")

    def run_all_tests(self):
        """Run comprehensive backend API tests"""
        print("🚀 Starting AI Course Builder Backend API Tests")
        print("=" * 60)
        
        # Basic tests
        self.test_health_endpoint()
        
        # Authentication setup
        if not self.create_test_user_session():
            print("❌ Cannot proceed without test user - stopping tests")
            return False
        
        # Authentication tests
        self.test_auth_me_endpoint()
        
        # Course management tests
        self.test_get_courses_empty()
        self.test_course_generation()
        self.test_get_specific_course()
        
        # Progress tracking tests
        self.test_update_progress()
        self.test_get_progress()
        
        # Cleanup tests
        self.test_delete_course()
        self.test_logout()
        
        # Cleanup
        self.cleanup_test_data()
        
        # Summary
        print("\n" + "=" * 60)
        print(f"📊 TEST SUMMARY: {self.tests_passed}/{self.tests_run} tests passed")
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"🎯 Success Rate: {success_rate:.1f}%")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return True
        else:
            print("⚠️  Some tests failed - check details above")
            return False

def main():
    tester = CourseBuilderAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())